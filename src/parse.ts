import { rejects } from "assert";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";
import { createReadStream, readFile, readFileSync, writeFileSync } from "fs";
import {join} from 'path'
const DIR = '/media/kalvis/DataMuch/GamesSteam/steamapps/common/Barotrauma/Content/Items'

const files = [
    // Barotrauma/Content/Items$ find -path '*.xml'
    './Alien/alienitems.xml',
    // './Assemblies/AlienGenericRoomAssembly4.xml',
    // './Assemblies/airlock doors.xml',
    // './Assemblies/Airlock Pump.xml',
    // './Assemblies/Alien Turret Assembly.xml',
    // './Assemblies/AlienArmoryAssembly1.xml',
    // './Assemblies/AlienCellBottom.xml',
    // './Assemblies/AlienCellTop.xml',
    // './Assemblies/AlienChestLarge.xml',
    // './Assemblies/AlienChestSmall.xml',
    // './Assemblies/AlienDoorAssembly1.xml',
    // './Assemblies/AlienDoorAssembly2.xml',
    // './Assemblies/AlienDoorAssembly5.xml',
    // './Assemblies/AlienFractalSpawnpoint.xml',
    // './Assemblies/AlienGenericRoomAssembly1.xml',
    // './Assemblies/AlienGenericRoomAssembly2.xml',
    // './Assemblies/AlienGenericRoomAssembly3.xml',
    // './Assemblies/AlienGenericRoomAssembly5.xml',
    // './Assemblies/AlienGenericRoomAssembly6.xml',
    // './Assemblies/AlienGenericRoomAssembly7.xml',
    // './Assemblies/AlienGenericRoomAssembly8.xml',
    // './Assemblies/AlienGenericRoomAssembly9.xml',
    // './Assemblies/AlienHatchAssembly.xml',
    // './Assemblies/AlienHatchAssembly2.xml',
    // './Assemblies/AlienHorizontalAssembly1.xml',
    // './Assemblies/AlienPumpAssembly.xml',
    // './Assemblies/AlienPumpAssembly1.xml',
    // './Assemblies/AlienPumpAssembly2.xml',
    // './Assemblies/AlienVaultAssembly1.xml',
    // './Assemblies/AlienVerticalAssembly1.xml',
    // './Assemblies/AlienVerticalAssembly2.xml',
    // './Assemblies/AlienVerticalAssembly3.xml',
    // './Assemblies/AutoDoor.xml',
    // './Assemblies/AutoHatch.xml',
    // './Assemblies/Automated Docking Hatch.xml',
    // './Assemblies/automatic airlock doors.xml',
    // './Assemblies/Automatic Bilge Pump.xml',
    // './Assemblies/ChargedAlienGenerator.xml',
    // './Assemblies/Diving Suit Locker.xml',
    // './Assemblies/Door.xml',
    // './Assemblies/Gas Cloud Vent.xml',
    // './Assemblies/Large Diving Gear Cabinet.xml',
    // './Assemblies/Pet Spawner Vent.xml',
    // './Assemblies/RuinAutoDoor.xml',
    // './Assemblies/RuinAutoHatch.xml',
    // './Assemblies/Small Diving Gear Cabinet.xml',
    // './Assemblies/WindowedAutoDoor.xml',
    './Button/button.xml',
    './Command/command.xml',
    './Containers/containers.xml',
    './CreatureLoot/creatureloot.xml',
    './Diving/divinggear.xml',
    './Door/doors.xml',
    './Electricity/lights.xml',
    './Electricity/poweritems.xml',
    './Electricity/signalitems.xml',
    './Engine/engine.xml',
    './Fabricators/fabricators.xml',
    // './Gardening/ballastflora.xml',
    './Gardening/gardeningtools.xml',
    './Gardening/growableplants.xml',
    './Gardening/plantproducts.xml',
    './Genetic/genetic.xml',
    './idcard.xml',
    './Jobgear/Assistant/assistant_gear.xml',
    './Jobgear/Assistant/assistant_talent_items.xml',
    './Jobgear/Captain/captain_gear.xml',
    './Jobgear/Captain/captain_talent_items.xml',
    './Jobgear/Clown/clown.xml',
    './Jobgear/Commoner/commoner_gear.xml',
    './Jobgear/Engineer/engineer_gear.xml',
    './Jobgear/Engineer/engineer_talent_items.xml',
    './Jobgear/Mechanic/mechanic_gear.xml',
    './Jobgear/Mechanic/mechanic_talent_items.xml',
    './Jobgear/Medic/medic_gear.xml',
    './Jobgear/Medic/medic_talent_items.xml',
    './Jobgear/misc.xml',
    './Jobgear/Security/securityofficer_gear.xml',
    './Jobgear/Security/securityofficer_talent_items.xml',
    './Jobgear/Watchman/watchman_gear.xml',
    './Labels/labels.xml',
    // './Ladder/ladder.xml',
    './Legacy/legacycommand.xml',
    './Legacy/legacycontainers.xml',
    './Legacy/legacyengine.xml',
    './Legacy/legacyfabricators.xml',
    './Legacy/legacyoxygengenerator.xml',
    './Legacy/legacypoweritems.xml',
    './Legacy/legacypump.xml',
    './Legacy/legacyrailgun.xml',
    './Legacy/legacysearchlight.xml',
    './Materials/materials.xml',
    './Materials/medmaterials.xml',
    './Materials/minerals.xml',
    './Medical/buffs.xml',
    './Medical/medical.xml',
    './Medical/poisons.xml',
    './Misc/misc.xml',
    './OxygenGenerator/oxygengenerator.xml',
    './Pets/PetEggs.xml',
    './Pets/PetItems.xml',
    './Pump/pump.xml',
    './Reactor/reactor.xml',
    './SearchLight/searchlight.xml',
    // './Shipwrecks/StructurePrefabsWrecked.xml',
    './Shipwrecks/wreckeditems.xml',
    './Tools/tools.xml',
    './Weapons/chaingun.xml',
    './Weapons/coilgun.xml',
    './Weapons/depthcharge.xml',
    './Weapons/dischargecoil.xml',
    './Weapons/explosives.xml',
    './Weapons/pulselaser.xml',
    './Weapons/railgun.xml',
    './Weapons/weapons.xml',
    './Weapons/turrethardpoint.xml',
]

const testpath = './Medical/medical.xml'

type IdString = string
type NumberString = string
type BooleanString = string
type NumbersWithComma = string
type StringsWithComma = string

interface ItemRaw {
    "Upgrade": {
        "$gameversion": "0.10.0.0",
        "$scale": "0.5"
    },
    "PreferredContainer": Array<{
        "$primary": string,
        "$minamount": NumberString,
        "$maxamount": NumberString,
        "$spawnprobability": NumberString,
    }>,
    "Price"?: {
        "Price": Array<{
            "$locationtype": "outpost" | "city" | "research" | "military" | "mine",
            "$multiplier": NumberString,
            "$minavailable": NumberString
        }>,
        "$baseprice": NumberString
    },
    "Fabricate"?: {
        "RequiredSkill": {
            "$identifier": "medical",
            "$level": NumberString
        },
        "RequiredItem": {
            "$identifier": IdString
        } | Array<{
            "$identifier": IdString
        }>,
        "$suitablefabricators": "medicalfabricator",
        "$requiredtime": NumberString,
        "$amount"?: NumberString
    },
    "Deconstruct": {
        "Item": Array<{
            "$identifier": IdString,
            "$mincondition": NumberString,
            "$outcondition"?: NumberString
        }>,
        "$time": NumberString
    },
    "InventoryIcon": {
        "$texture": string,
        "$sourcerect": NumbersWithComma,
        "$origin": NumbersWithComma
    },
    "Sprite": any,
    "Body": any,
    "SuitableTreatment"?: any,
    "MeleeWeapon": any,
    "$name": "",
    "$identifier": IdString,
    "$category": string,
    "$Tags": StringsWithComma,
    "$maxstacksize": NumberString,
    "$cargocontaineridentifier": string,
    "$description": "",
    "$useinhealthinterface": BooleanString,
    "$scale": NumberString,
    "$impactsoundtag": string,
    "$RequireAimToUse": BooleanString
}

const parser = new XMLParser({
    // commentPropName: "#comment",
    ignoreAttributes: false,
    attributeNamePrefix: '$',
    alwaysCreateTextNode: true,
});

interface Item {
    id: IdString
    title: string
    price: number
}

interface Recipe {
    id: IdString
    parts: Array<{
        id: IdString
        input: number
        output: number
    }>,
}

const items: Record<IdString, Item> = {}
const recipes: Record<string, Recipe> = {}

;
(async () => {
    for(const path of files) {
        try {
            const xml = await new Promise<Buffer>((resolve, reject) => readFile(join(DIR, path), (err, buffer) => err ? reject(err) : resolve(buffer)))
            const json = parser.parse(xml.toString())

            const {Item, ...namedRawItems} = json.Items
            const rawItems = [
                ...Object.entries(namedRawItems),
                ...((Array.isArray(Item) ? Item : []) as ItemRaw[])
                    .map((raw) => [raw.$identifier, raw] as const),
            ] as Array<[string, ItemRaw]>

            // if(path === './Jobgear/Assistant/assistant_gear.xml') {
            //     console.log(rawItems)
            //     process.exit(1)
            // }

            for(const [title, raw] of rawItems) {
                if(!raw.Price) {
                    console.warn(`No Price for "${title} (${raw.$identifier})" within "${path}", skipping..`)
                    continue
                }
                items[raw.$identifier] = {
                    id: raw.$identifier,
                    title,
                    price: Number(raw.Price.$baseprice)
                }

                const inputItems = !raw.Fabricate ? [] : Array.isArray(raw.Fabricate.RequiredItem) ? raw.Fabricate.RequiredItem : [raw.Fabricate.RequiredItem ?? []]
                const outputItems = !raw.Deconstruct ? [] : Array.isArray(raw.Deconstruct.Item) ? raw.Deconstruct.Item : [raw.Deconstruct.Item ?? []]

                const allItems: IdString[] = [...new Set([...inputItems, ...outputItems].map((item) => item.$identifier))]
                recipes[raw.$identifier] = {
                    id: raw.$identifier,
                    parts: allItems.map((id) => {
                        const inputItemCount = inputItems.filter((item) => item.$identifier === id).length
                        const amount = (raw.Fabricate?.$amount ? Number(raw.Fabricate?.$amount) : 1)
                        const outputItemCount = outputItems.filter((item) => item.$identifier === id).length
                        const outputItemCondition = outputItems.find((item) => item.$identifier === id)?.$outcondition  // Assuming all copies are equal.
                        return {
                            id,
                            input: inputItemCount / amount,
                            output: outputItemCount * (outputItemCondition ? Number(outputItemCondition) : 1),
                        }
                    }),
                }
            }


        } catch(err) {
            (err as Error).message = (err as Error).message + ` (${path})`
            throw err
        }
    }

    // console.log(recipes)
    // for(const item of Object.values(items)) console.log(item)
    // for(const recipe of Object.values(recipes)) console.log(recipe)
    writeFileSync(join(__dirname, '..', 'dist', 'items.json'), JSON.stringify(items))
    writeFileSync(join(__dirname, '..', 'dist', 'recipes.json'), JSON.stringify(recipes))
// console.log(JSON.stringify(parsed.Items.Plastiseal))
})().catch((err: Error) => {
    console.error(err)
    process.exit(1)
})