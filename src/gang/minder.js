/** @param {NS} ns **/
import { importJSON } from '/common/lib.js';
import { buildGangInfo, buildMemberInfo, buyHackUpgradesForMember,
         buyHackAugmentationsForMember, updateTaskForMembers } from '/gang/lib.js'

export async function main(ns) {
    ns.disableLog('sleep');
    // program constants
    const configFile = '/config/gang.txt';
    const loopInterval = 1000;
    const configUpdateInterval = 60;

    var config;
    var configUpdateCounter = 0;
    var reductionCycle;
    while (true) {
        configUpdateCounter -= 1;
        if (configUpdateCounter <= 0) {
            // import configuration
            config = importJSON(ns, configFile);
            ns.print('imported config:\n', config);
            configUpdateCounter = configUpdateInterval;
        }

        if (ns.gang.inGang()) {
            // instantiate objects
            var gang = buildGangInfo(ns, config);
            var player = ns.getPlayer();

            // update vars
            gang.maxPurchaseAmount = player.money * gang.maxPurchaseRatio;

            // recruit new members
            while (ns.gang.canRecruitMember()) {
                let memberName = `${gang.memberNameTemplate}-${gang.members.length}`;
                ns.gang.recruitMember(memberName);
                gang.members = buildMemberInfo(ns);
                await ns.sleep(0);
            }

            // ascend candidate members
            for (let member of gang.members) {
                if (member.ascensionResult && gang.minMemberHackAscensionMultiplier < member.ascensionResult['hack']) {
                    // ascend!
                    let result = ns.gang.ascendMember(member.name);
                }
            }

            // process member upgrades
            for (let member of gang.members) {
                if (gang.isHacking) {
                    // buy hacking related augments only
                    buyHackAugmentationsForMember(ns, member, gang.equipment, player.money, player.money);
                    player = ns.getPlayer();

                    // buy hacking related upgrades only
                    buyHackUpgradesForMember(ns, member, gang.equipment, player.money, gang.maxPurchaseAmount);
                    player = ns.getPlayer();
                } else {
                    // TODO: buy combat and hack related upgrades
                }
            }

            // Check up on gang stats to identify focus areas
            var wantedLevelOver = gang.wantedLevel >= gang.maxWantedThreshold;
            var wantedLevelUnder = gang.wantedLevel <= gang.minWantedThreshold;
            var wantedPenaltyOver = (1 - gang.wantedPenalty) > gang.maxWantedPenaltyPercent

            // Check up on members to identify current efforts

            if ((wantedLevelOver && wantedPenaltyOver) && !reductionCycle) {
                // we need to reduce wanted level
                reductionCycle = true;
            } else if (wantedLevelUnder && reductionCycle) {
                // we've reduced enough
                reductionCycle = false;
            } else if (!reductionCycle) {
                // hack
                updateTaskForMembers(ns, gang.members, gang.activeTaskName, gang.minMemberHackingLevel);
            } else if (reductionCycle) {
                // reduce back to minimum
                updateTaskForMembers(ns, gang.members, gang.reductionTaskName, gang.minMemberHackingLevel);
            }
        } else {
            // TODO: Figure out if player's desired faction/gang can be joined and join it
        }

        await ns.sleep(loopInterval);
    }
}
