import {CellResourceItem, CellTypes, RaceProcesses} from './resource';
import {CellRace} from './race';

/**
 * механика для ячейки
 */
class CellEngine {
    constructor(coords) {
        this.coords = coords;
        this.type = CellTypes.SHADOW;
        this.race = null;
        this.resource = null;
        this.owner = null;
        this.progress = 0;
    }
    changeToRace(i, raceType, color) {
        this.type = CellTypes.RACE;
        this.race = new CellRace(i, raceType, color);
        this.setOwner(i);
    }
    changeToResource(resourceType) {
        this.type = CellTypes.RESOURCE;
        this.resource = new CellResourceItem(resourceType);
    }
    changeToRandomResource() {
        this.type = CellTypes.RESOURCE;
        this.resource = new CellResourceItem();
        console.log('changeToRandomResource', this.resource);
    }
    setOwner(raceId) {
        this.owner = raceId;
    }
    getStyles() {
        let r = [];
        r.push(this.type);
        if (this.type === CellTypes.RESOURCE) {
            r.push(this.resource.getStyle());
        } else if (this.type === CellTypes.RACE) {
            r.push(this.race.getStyle());
        }
        return r;
    }
    checkCoords(coords) {
        return this.coords.x === coords.x && this.coords.y === coords.y;
    }
    checkAmINext(raceId) {
        if (this.type = CellTypes.SHADOW) {
            return true;
        } else if (this.type = CellTypes.RESOURCE && this.owner !== raceId) {
            return true;
        } /* else if (this.type = CellTypes.RACE && this.owner !== raceId) {
            return true;
        }*/
    }
    getSelfInfo() {
        return {
            coords: this.coords,
            type: this.type,
            owner: this.owner
        }
    }
    /**
     * proceed a cell on increment value
     * if increment >= 100, process is completed (true)
     * if process not assigned with cell type, process is declined (false)
     * if process not finished, return value is null
     * @param {*} raceId 
     * @param {*} process 
     * @param {*} increment 
     */
    tryProceed(raceId, process, increment) {
        if (this.type === CellTypes.RESOURCE && this.owner === null && process === RaceProcesses.BUILD_FABRIC) {
            this.progress += increment;
        } else if (this.type === CellTypes.SHADOW && process === RaceProcesses.RESEARCH_CELL) {
            this.progress += increment;
        } else if (this.type === CellTypes.RESOURCE && this.owner === raceId && process === RaceProcesses.CONNECT_CELL) {
            this.progress += increment;
        } else {
            console.log('tryProceed error');
            return false;
        }
        if (this.progress >= 100) {
            return true;
        }
        //console.log('tryProceed', raceId, process, this.progress);
        return null;
    }
    resetProgress() {
        this.progress = 0;
    }
    /**
     * calculate resources for owner
     */
    getResourceForTick() {
        throw Error('not implemented');
    }
};

export default CellEngine;