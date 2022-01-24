const fs = require('fs');

function parse(file) {
    const journal = [];
    for (const line of fs.readFileSync(file).toString().split('\n')) {
        try {
            journal.push(JSON.parse(line));
        } catch {
            continue;
        }
    }

    const now = Date.now();
    const missions = {};
    const flatMissions = {};
    const statsTotal = { reward: 0, bounty: 0, kills: 0 };
    const statsHour = { reward: 0, bounty: 0, kills: 0 };
    let currentSystem;
    journal.filter((ev) => (ev.event === 'MissionAccepted' && ev.Name.match(/^Mission_Massacre/) ||
        ev.event === 'Bounty' ||
        (ev.event === 'StartJump' && ev.JumpType === 'Hyperspace') ||
        ev.event === 'MissionRedirected' ||
        ev.event === 'Location'
    )).map((ev) => {
        if (ev.event === 'StartJump' || ev.event === 'Location') {
            currentSystem = ev.StarSystem;
        } else if (ev.event === 'MissionAccepted') {
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
            missions[target].missions[ev.Faction].each = Math.round(missions[target].missions[ev.Faction].reward / missions[target].missions[ev.Faction].kills);
        } else if (ev.event === 'aMissionRedirected') {
            if (flatMissions[ev.MissionID]) {
                const mission = flatMissions[ev.MissionID];
                const target = `${mission.targetFaction} @ ${mission.targetSystem}`;
                const idx = missions[target].missions[mission.giver].missions.find((m) => m.id === ev.MissionID);
                if (idx !== -1) {
                    missions[target].missions[mission.giver].missions.splice(idx, 1);
                    missions[target].missions[mission.giver].number--;
                    missions[target].missions[mission.giver].kills -= mission.kills;
                    missions[target].missions[mission.giver].done -= mission.kills;
                    missions[target].missions[mission.giver].reward -= mission.reward;
                    missions[target].missions[mission.giver].each = Math.round(missions[target].missions[mission.giver].reward /
                        missions[target].missions[mission.giver].kills);
                    if (missions[target].missions[mission.giver].number === 0)
                        delete missions[target].missions[mission.giver];
                }
            }
        } else if (ev.event === 'Bounty') {
            const target = `${ev.VictimFaction} @ ${currentSystem}`;
            if (missions[target] && missions[target].missions) {
                for (const f of Object.keys(missions[target].missions)) {
                    if (missions[target].missions[f].done < missions[target].missions[f].kills) {
                        missions[target].missions[f].done++;
                        if (now - Date.parse(ev.timestamp) < 3600 * 1000) {
                            statsHour.reward += missions[target].missions[f].each;
                        }
                        statsTotal.reward += missions[target].missions[f].each;
                    }
                }
                if (now - Date.parse(ev.timestamp) < 3600 * 1000) {
                    statsHour.bounty += ev.TotalReward;
                    statsHour.kills++;
                }
                statsTotal.bounty += ev.TotalReward;
                statsTotal.kills++;
            }
        }
    });

    statsHour.money = statsHour.reward + statsHour.bounty;
    statsTotal.money = statsTotal.reward + statsTotal.bounty;

    Object.keys(missions).map((t) => {
        missions[t].number = Object.keys(missions[t].missions).reduce((a, c) => (a + missions[t].missions[c].number), 0);
        missions[t].reward = Object.keys(missions[t].missions).reduce((a, c) => (a + missions[t].missions[c].reward), 0);
        missions[t].kills = Object.keys(missions[t].missions).reduce((a, c) => (Math.max(a, missions[t].missions[c].kills)), 0);
        missions[t].remain = Object.keys(missions[t].missions).reduce((a, c) => (Math.max(a, missions[t].missions[c].kills - missions[t].missions[c].done)), 0);
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

module.exports = parse;
