const fs = require('fs');
const path = require('path');

function parseEvent(ev, context) {
    const { missions, flatMissions, statsHour, statsTotal } = context;

    const lastHour = (ts) => (context.now - Date.parse(ts) < 3600 * 1000);

    if ((ev.event === 'StartJump' && ev.JumpType === 'Hyperspace') || ev.event === 'Location') {
        context.currentSystem = ev.StarSystem;
    } else if (ev.event === 'MissionAccepted' && ev.Name.match(/^Mission_Massacre/)) {
        if (new Date(ev.Expiry) < context.now)
            return;
        const mission = {
            id: ev.MissionID,
            targetSystem: ev.DestinationSystem,
            targetFaction: ev.TargetFaction,
            giver: ev.Faction,
            kills: ev.KillCount,
            station: ev.DestinationStation,
            reward: ev.Reward,
            each: Math.round(ev.Reward / ev.KillCount)
        };

        const target = `${ev.TargetFaction} @ ${ev.DestinationSystem}`;
        if (missions[target] === undefined)
            missions[target] = { missions: {}, done: 0, number: 0, kills: 0, reward: 0 };
        if (missions[target].missions[ev.Faction] === undefined)
            missions[target].missions[ev.Faction] = { missions: [], done: 0, number: 0, kills: 0, reward: 0 };

        missions[target].missions[ev.Faction].missions.push(mission);
        flatMissions[ev.MissionID] = mission;

        missions[target].missions[ev.Faction].number++;
        missions[target].missions[ev.Faction].reward += ev.Reward;
        missions[target].missions[ev.Faction].kills += ev.KillCount;
        missions[target].missions[ev.Faction].each = Math.round(missions[target].missions[ev.Faction].reward /
            missions[target].missions[ev.Faction].kills);
    } else if (ev.event === 'MissionCompleted' || ev.event === 'MissionAbandoned' || ev.event === 'MissionFailed') {
        // TODO This should (ideally) be a two-step process on MissionRedirected and on MissionCompleted
        if (flatMissions[ev.MissionID]) {
            const mission = flatMissions[ev.MissionID];
            const target = `${mission.targetFaction} @ ${mission.targetSystem}`;
            const idx = missions[target].missions[mission.giver].missions.findIndex((m) => m.id === ev.MissionID);
            if (idx !== -1) {
                missions[target].missions[mission.giver].number--;
                missions[target].missions[mission.giver].kills -= mission.kills;
                missions[target].missions[mission.giver].done = Math.max(0,
                    missions[target].missions[mission.giver].done - mission.kills);
                missions[target].missions[mission.giver].reward -= mission.reward;
                if (context.session) {
                    statsTotal.reward -= missions[target].missions[mission.giver].each * mission.kills;
                    if (ev.event === 'MissionCompleted')
                        statsTotal.reward += mission.reward;
                }
                missions[target].missions[mission.giver].missions.splice(idx, 1);
                missions[target].missions[mission.giver].each = Math.round(missions[target].missions[mission.giver].reward /
                    missions[target].missions[mission.giver].kills);
                if (missions[target].missions[mission.giver].number === 0)
                    delete missions[target].missions[mission.giver];
            }
        }
    } else if (ev.event === 'Bounty') {
        const target = `${ev.VictimFaction} @ ${context.currentSystem}`;
        if (missions[target] && missions[target].missions) {
            for (const f of Object.keys(missions[target].missions)) {
                if (missions[target].missions[f].done < missions[target].missions[f].kills) {
                    missions[target].missions[f].done++;
                    if (context.session) {
                        if (lastHour(ev.timestamp)) {
                            statsHour.reward += missions[target].missions[f].each;
                        }
                        statsTotal.reward += missions[target].missions[f].each;
                    }
                }
            }
            if (context.session) {
                if (lastHour(ev.timestamp)) {
                    statsHour.bounty += ev.TotalReward;
                    statsHour.kills++;
                }
                statsTotal.bounty += ev.TotalReward;
                statsTotal.kills++;
            }
        }
    };
}

function parseFile(file, context) {
    for (const line of fs.readFileSync(file).toString().split('\n')) {
        let event;
        try {
            event = JSON.parse(line);
        } catch {
            continue;
        }
        parseEvent(event, context);
    }
}

function parseAll(test, oldDate) {
    const now = Date.now();

    let list, dir;
    try {
        dir = test || path.join(process.env.USERPROFILE, '/Saved Games/Frontier Developments/Elite Dangerous');
        list = fs.readdirSync(dir).filter((f) => f.match(/Journal\.([0-9]{2})([0-9]{2})([0-9]{2})/))
        .sort((a, b) => ('' + a.attr).localeCompare(b.attr));
    } catch (e) {
        throw new Error('Cannot open Elite Dangerous journal');
    }

    const context = {
        missions: {},
        flatMissions: {},
        currentSystem: undefined,
        sesion: false,
        statsHour: { reward: 0, bounty: 0, kills: 0 },
        statsTotal: { reward: 0, bounty: 0, kills: 0 },
        now: Date.now()
    };
    const last = list.pop();
    if (oldDate) {
        const lastJournal = fs.readFileSync(path.join(dir, last)).toString().split('\n');
        const lastLine = lastJournal[lastJournal.length - 2];
        const lastTimestamp = JSON.parse(lastLine);
        context.now = lastTimestamp;
    }
    for (const file of list) {
        const g = file.match(/Journal.*\.([0-9]{2})([0-9]{2})([0-9]{2})/);
        if (!g) continue;
        const d = Date.parse(`20${g[1]}-${g[2]}-${g[3]}`);
        if (context.now - d > 7 * 24 * 3600 * 1000)
            continue;

        parseFile(path.join(dir, file), context);
    }
    context.session = true;
    parseFile(path.join(dir, last), context);

    const { missions, statsHour, statsTotal } = context;

    statsHour.money = statsHour.reward + statsHour.bounty;
    statsTotal.money = statsTotal.reward + statsTotal.bounty;

    Object.keys(missions).map((t) => {
        missions[t].number = Object.keys(missions[t].missions).reduce((a, c) =>
            (a + missions[t].missions[c].number), 0);
        missions[t].reward = Object.keys(missions[t].missions).reduce((a, c) =>
            (a + missions[t].missions[c].reward), 0);
        missions[t].kills = Object.keys(missions[t].missions).reduce((a, c) =>
            (Math.max(a, missions[t].missions[c].kills)), 0);
        missions[t].remain = Object.keys(missions[t].missions).reduce((a, c) =>
            (Math.max(a, missions[t].missions[c].kills - missions[t].missions[c].done)), 0);
            
        missions[t].done = missions[t].kills - missions[t].remain;
        if (missions[t].kills > 0)
            missions[t].each = Math.round(missions[t].reward / missions[t].kills);
        else
            missions[t].each = 0;
        if (missions[t].number === 0)
            delete missions[t];
    });

    return {
        missions,
        statsHour,
        statsTotal
    };
}

module.exports = parseAll;
