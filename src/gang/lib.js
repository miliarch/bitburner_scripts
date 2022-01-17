/** @param {NS} ns **/
// Function library for cross-script use
import { roundHundreds } from '/common/lib.js';

export async function main(ns) {
    ns.tprint('use me right, buddy')
}


// ####################
// ### Object setup ###
// ####################

export function buildEquipmentStats(ns, equipmentName) {
    var stats = ns.gang.getEquipmentStats(equipmentName);
    for (const [key, value] of Object.entries(stats)) {
        var tmpStats = {}
        tmpStats[key] = {}
        tmpStats[key]['skill'] = value
        tmpStats[key]['exp'] = calcExpIncreaseForSkillIncrease(value)
        stats[key] = tmpStats[key]
    }
    return stats;
}

export function buildGangInfo(ns, config) {
    var gang = ns.gang.getGangInformation();
    gang.memberNameTemplate = config['member_name_template'];
    gang.minWantedThreshold = config['min_wanted_threshold'];
    gang.maxWantedThreshold = config['max_wanted_threshold'];
    gang.maxWantedPenaltyPercent = config['max_wanted_penalty_percent'];
    gang.maxPurchaseRatio = config['max_purchase_ratio'];
    gang.minMemberHackingLevel = config['min_member_hacking_level'];
    gang.minMemberHackAscensionMultiplier = config['min_member_hack_ascension_multiplier'];
    gang.activeTaskName = config['active_task_name'];
    gang.reductionTaskName = config['reduction_task_name'];
    gang.members = buildMemberInfo(ns);
    gang.tasks = buildTaskInfo(ns);
    gang.equipment = buildEquipmentInfo(ns);
    return gang;
}

export function buildEquipmentInfo(ns) {
    var equipments = [];
    for (let name of ns.gang.getEquipmentNames()) {
        let equipment = {};
        equipment.name = name;
        equipment.cost = ns.gang.getEquipmentCost(equipment.name);
        equipment.type = ns.gang.getEquipmentType(equipment.name);
        equipment.stats = buildEquipmentStats(ns, name);
        equipments.push(equipment);
    }
    return equipments;
}

export function buildMemberInfo(ns) {
    var members = []
    for (let name of ns.gang.getMemberNames()) {
        var member = ns.gang.getMemberInformation(name);
        member.ascensionResult = ns.gang.getAscensionResult(name);
        members.push(member);
    }
    return members 
}

export function buildTaskInfo(ns) {
    var tasks = [];
    for (let name of ns.gang.getTaskNames()) {
        tasks.push(ns.gang.getTaskStats(name));
    }
    return tasks;
}


// ######################################
// ### Miscellaneous helper functions ###
// ######################################

export function calcExpIncreaseForSkillIncrease(skillIncrease) {
    // Take skillIncrease in multiplier form (e.g.: +10% == 1.1), return expIncrease in multiplier form (e.g.: +2.5% == 1.025)
    const percentPerLevel = 0.05;
    const expIncreasePerLevel = 1.25;
    let percent = roundHundreds(skillIncrease - 1);
    let expMultiplier = percent / percentPerLevel;
    return (roundHundreds(expMultiplier * expIncreasePerLevel) / 100) + 1;
}

export function buyHackUpgradesForMember(ns, member, equipment, money, limit) {
    // filter non-hack non-augment equipment out of array
    var validUpgrades = equipment.filter(e => "hack" in e.stats && e.type != 'Augmentation');

    // sort equipment on highest hack exp benefit
    validUpgrades = validUpgrades.sort((a, b) => (a['stats']['hack']['exp'] > b['stats']['hack']['exp']) ? -1 : 1);

    // do work
    for (equipment of validUpgrades) {
        let memberHasUpgrade = member.upgrades.includes(equipment.name)
        if (!memberHasUpgrade && equipment.cost <= limit && money >= equipment.cost) {
            let success = ns.gang.purchaseEquipment(member.name, equipment.name);
            if (success) {
                let out_str = `Purchased upgrade ${equipment.name} for ${member.name} (\$${ns.nFormat(equipment.cost, '0.00a')})`
                ns.print(out_str);
                ns.toast(out_str, 'info');
                money -= equipment.cost;
                limit -= equipment.cost;
            }
        }
    }
}

export function buyHackAugmentationsForMember(ns, member, equipment, money, limit) {
    // filter non-hack non-augment equipment out of array
    var validUpgrades = equipment.filter(e => "hack" in e.stats && e.type == 'Augmentation');

    // sort equipment on highest hack exp benefit
    validUpgrades = validUpgrades.sort((a, b) => (a['stats']['hack']['exp'] > b['stats']['hack']['exp']) ? -1 : 1);

    // do work
    for (equipment of validUpgrades) {
        let memberHasAugment = member.augmentations.includes(equipment.name)
        if (!memberHasAugment && equipment.cost <= limit && money >= equipment.cost) {
            let success = ns.gang.purchaseEquipment(member.name, equipment.name);
            if (success) {
                let out_str = `Purchased augmentation ${equipment.name} for ${member.name} (\$${ns.nFormat(equipment.cost, '0.00a')})`
                ns.print(out_str);
                ns.toast(out_str, 'info');
                money -= equipment.cost;
                limit -= equipment.cost;
            }
        }
    }
}

export function updateTaskForMembers(ns, members, taskName, minHackingLevel) {
    for (let member of members) {
        if (member.task != taskName && member.hack >= minHackingLevel) {
            ns.gang.setMemberTask(member.name, taskName);
        } else if (member.task != 'Train Hacking' && member.hack < minHackingLevel) {
            ns.gang.setMemberTask(member.name, 'Train Hacking')
        }
    }
}
