import {Helper} from '../helper';
import Bus from '../bus.js';
import { CellTypes, RaceProcesses } from './resource';

if (typeof window.Bus === 'undefined') {
    window.Bus = Bus;
}

const RaceTypes = {
    BEAR: 'bear',
    TROLL: 'troll',
    TIGER: 'tiger',
    MASK: 'mask',
    SPIDER: 'spider',
    RAT: 'rat',
    MONKEY: 'monkey',
    CAT: 'cat',
    GOOSE: 'goose',
    EAGLE: 'eagle',
    BEE: 'bee'
};

const getRandomType = () => {
    const types = Object.keys(RaceTypes);
    const rand = Helper.randomizer(types.length);
    return RaceTypes[types[rand]];
};


class RaceProps {
    constructor() {
        this.hardworking = Helper.randomizer(9) + 1;
        this.research = Helper.randomizer(9) + 1;
        this.diplomacy = Helper.randomizer(9) + 1;
        this.agressive = Helper.randomizer(9) + 1;
        this.preferences = this.getPreferences();
    }
    getPreferences() {
        let baseSort = [
            this.hardworking + '_' + RaceProcesses.BUILD_FABRIC,
            this.research + '_' + RaceProcesses.RESEARCH_CELL,
            this.diplomacy + '_' + RaceProcesses.CONNECT_CELL,
            this.agressive + '_' + RaceProcesses.ATTACK_ENEMY 
        ];
        baseSort.sort();
        for (let i in baseSort) {
            baseSort[i] = baseSort[i].replace(/[0-9]_/g, '');
        }
        return baseSort;
    }
    getIncrementForProcess(process) {
        let mapping = {};
        mapping[RaceProcesses.RESEARCH_CELL] = 'research';
        mapping[RaceProcesses.BUILD_FABRIC] = 'hardworking';
        mapping[RaceProcesses.CONNECT_CELL] = 'diplomacy';
        mapping[RaceProcesses.ATTACK_ENEMY] = 'agressive';
        return this[mapping[process]];
    }
};

 /**
  * класс расы для игрового движка
  */
class Race {
    constructor(i, n, mapSize) {
        this.id = {i, n, mapSize};
        this.coords = Helper.getRandomCellInPart(i, n, mapSize);
        this.type = getRandomType();
        this.props = new RaceProps();
        this.color = Helper.getRandomColor();
        this.resources = [];
        this.process = null;
        this.target = null;
        this.targetStack = [];
        window.Bus.$on('i-am-next', (payload) => {
            this.onCellIAmNextResponse(payload);
        });
        window.Bus.$on('cell-process-decline', (p) => this.onCellProcessDecline(p));
        window.Bus.$on('cell-proceed', (p) => this.onCellProceed(p));
        window.Bus.$on('resources-pack', (p) => this.onReceiveResourcesPack(p));
    }
    whatNext() {
        if (this.process === null) {
            return {
                process: null,
                prefs: this.props.getPreferences()
            }
        } else {
            return {
                process: this.process,
                target: this.target,
                increment: this.props.getIncrementForProcess(this.process)
            }
        }
    }
    setProcess(process, target) {
        this.process = process;
        this.target = target;
    }

    /**
     * main algorythm to choose next target cell
     */
    getTarget() {
        const prefs = this.props.getPreferences();
        if (this.targetStack.length === 0) {
            console.log('getTarget empty');
            return null;
        }
        let stack = this.targetStack.map((item) => {
            return {
                value: Helper.calculateDistantion(item.coords, this.coords) * 
                    Helper.calculatePreferenceMultipier(item.process, prefs),
                coords: item.coords,
                process: item.process
            }
        });
        stack.sort(function(before, next) {
            return before.value - next.value;
        });

        const firstValue = stack[0].value;
        stack = stack.filter(item => item.value <= firstValue);
        let target = stack[0];
        if (stack.length > 1) {
            const rand = Helper.randomizer(stack.length);
            target = stack[rand];
        }
        return target;
    }
    clearStack() {
        this.targetStack.length = 0;
    }
    /**
     * response from cell who can be processed
     * @param payload {{
     *      from: {*}
     *      to: {*}
     * }}
     */
    onCellIAmNextResponse(payload) {
        if (parseInt(payload.to) !== this.id.i) {
            return false;
        }
        if (parseInt(payload.from.owner) === this.id.i) {
            return false;
        }
        const item = {
            coords: payload.from.coords,
            process: this.getProcessNameByCell(payload.from.type, payload.from.owner),
            type: payload.from.type
        };
        this.targetStack.push(item);
    }
    /**
     * response from cell after request 'cell-process' if cell can't be proceed;
     * so its required to repeat find targets
     */
    onCellProcessDecline() {
        this.setProcess(null, null);
        this.clearStack();
    }
    /**
     * response from cell after request 'cell-process' if cell fully proceed
     * so its required to find new targets
     */
    onCellProceed(payload) {
        if (parseInt(payload.to) !== this.id.i) {
            return;
        }
        this.setProcess(null, null);
        this.clearStack();
        
    }
    onReceiveResourcesPack(payload) {
        //@todo
        throw Error('not inmplemented');
    }
    /**
     * define a process for target
     * @param {*} cellType 
     * @param {*} cellOwner 
     */
    getProcessNameByCell(cellType, cellOwner) {
        if (cellType === CellTypes.SHADOW) {
            return RaceProcesses.RESEARCH_CELL;
        } else if (cellType === CellTypes.RESOURCE && cellOwner !== null && cellOwner !== this.id.i) {
            const prefs = this.props.getPreferences();
            for (let pref in prefs) {
                if (pref === RaceProcesses.ATTACK_ENEMY) {
                    return RaceProcesses.ATTACK_ENEMY;
                }
                if (pref === RaceProcesses.CONNECT_CELL) {
                    return RaceProcesses.CONNECT_CELL;
                }
            }
        } else if (cellType === CellTypes.RESOURCE) {
            return RaceProcesses.BUILD_FABRIC;
        }
    }
};

/**
 * все расы на карте
 */
class Races {
    constructor() {
        this.list = [];
    }
    add(race) {
        this.list.push(race);
    }
    get(i) {
        return this.list[i];
    }
}

/**
 * ячейка расы
 */
class CellRace {
    constructor(i, raceType, color) {
        this.i = i;
        this.raceType = raceType;
        this.color = color;
    }
    getStyle() {
        return this.raceType + ' ' + this.color;
    }
}

export {Race, Races, CellRace};