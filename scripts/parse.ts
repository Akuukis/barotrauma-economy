import { XMLParser } from "fast-xml-parser";
import { copyFileSync, mkdirSync, readFile, writeFileSync } from "fs";
import {join, dirname} from 'path'

// import { BooleanString, IdItemString, Item, NumberString, NumbersWithComma, Recipe, StringsWithComma } from "./common";
import '../src/common'


const BAROTRAUMA_DIR = '/media/kalvis/DataMuch/GamesSteam/steamapps/common/Barotrauma'
const OUT_DIR = join(__dirname, '..', 'dist')

const files = [
    // Barotrauma/Content/Items$ find -path '*.xml'
    'Content/Items/Alien/alienitems.xml',
    // 'Content/Items/Assemblies/AlienGenericRoomAssembly4.xml',
    // 'Content/Items/Assemblies/airlock doors.xml',
    // 'Content/Items/Assemblies/Airlock Pump.xml',
    // 'Content/Items/Assemblies/Alien Turret Assembly.xml',
    // 'Content/Items/Assemblies/AlienArmoryAssembly1.xml',
    // 'Content/Items/Assemblies/AlienCellBottom.xml',
    // 'Content/Items/Assemblies/AlienCellTop.xml',
    // 'Content/Items/Assemblies/AlienChestLarge.xml',
    // 'Content/Items/Assemblies/AlienChestSmall.xml',
    // 'Content/Items/Assemblies/AlienDoorAssembly1.xml',
    // 'Content/Items/Assemblies/AlienDoorAssembly2.xml',
    // 'Content/Items/Assemblies/AlienDoorAssembly5.xml',
    // 'Content/Items/Assemblies/AlienFractalSpawnpoint.xml',
    // 'Content/Items/Assemblies/AlienGenericRoomAssembly1.xml',
    // 'Content/Items/Assemblies/AlienGenericRoomAssembly2.xml',
    // 'Content/Items/Assemblies/AlienGenericRoomAssembly3.xml',
    // 'Content/Items/Assemblies/AlienGenericRoomAssembly5.xml',
    // 'Content/Items/Assemblies/AlienGenericRoomAssembly6.xml',
    // 'Content/Items/Assemblies/AlienGenericRoomAssembly7.xml',
    // 'Content/Items/Assemblies/AlienGenericRoomAssembly8.xml',
    // 'Content/Items/Assemblies/AlienGenericRoomAssembly9.xml',
    // 'Content/Items/Assemblies/AlienHatchAssembly.xml',
    // 'Content/Items/Assemblies/AlienHatchAssembly2.xml',
    // 'Content/Items/Assemblies/AlienHorizontalAssembly1.xml',
    // 'Content/Items/Assemblies/AlienPumpAssembly.xml',
    // 'Content/Items/Assemblies/AlienPumpAssembly1.xml',
    // 'Content/Items/Assemblies/AlienPumpAssembly2.xml',
    // 'Content/Items/Assemblies/AlienVaultAssembly1.xml',
    // 'Content/Items/Assemblies/AlienVerticalAssembly1.xml',
    // 'Content/Items/Assemblies/AlienVerticalAssembly2.xml',
    // 'Content/Items/Assemblies/AlienVerticalAssembly3.xml',
    // 'Content/Items/Assemblies/AutoDoor.xml',
    // 'Content/Items/Assemblies/AutoHatch.xml',
    // 'Content/Items/Assemblies/Automated Docking Hatch.xml',
    // 'Content/Items/Assemblies/automatic airlock doors.xml',
    // 'Content/Items/Assemblies/Automatic Bilge Pump.xml',
    // 'Content/Items/Assemblies/ChargedAlienGenerator.xml',
    // 'Content/Items/Assemblies/Diving Suit Locker.xml',
    // 'Content/Items/Assemblies/Door.xml',
    // 'Content/Items/Assemblies/Gas Cloud Vent.xml',
    // 'Content/Items/Assemblies/Large Diving Gear Cabinet.xml',
    // 'Content/Items/Assemblies/Pet Spawner Vent.xml',
    // 'Content/Items/Assemblies/RuinAutoDoor.xml',
    // 'Content/Items/Assemblies/RuinAutoHatch.xml',
    // 'Content/Items/Assemblies/Small Diving Gear Cabinet.xml',
    // 'Content/Items/Assemblies/WindowedAutoDoor.xml',
    'Content/Items/Button/button.xml',
    'Content/Items/Command/command.xml',
    'Content/Items/Containers/containers.xml',
    'Content/Items/CreatureLoot/creatureloot.xml',
    'Content/Items/Diving/divinggear.xml',
    'Content/Items/Door/doors.xml',
    'Content/Items/Electricity/lights.xml',
    'Content/Items/Electricity/poweritems.xml',
    'Content/Items/Electricity/signalitems.xml',
    'Content/Items/Engine/engine.xml',
    'Content/Items/Fabricators/fabricators.xml',
    // 'Content/Items/Gardening/ballastflora.xml',
    'Content/Items/Gardening/gardeningtools.xml',
    'Content/Items/Gardening/growableplants.xml',
    'Content/Items/Gardening/plantproducts.xml',
    'Content/Items/Genetic/genetic.xml',
    'Content/Items/idcard.xml',
    'Content/Items/Jobgear/Assistant/assistant_gear.xml',
    'Content/Items/Jobgear/Assistant/assistant_talent_items.xml',
    'Content/Items/Jobgear/Captain/captain_gear.xml',
    'Content/Items/Jobgear/Captain/captain_talent_items.xml',
    'Content/Items/Jobgear/Clown/clown.xml',
    'Content/Items/Jobgear/Commoner/commoner_gear.xml',
    'Content/Items/Jobgear/Engineer/engineer_gear.xml',
    'Content/Items/Jobgear/Engineer/engineer_talent_items.xml',
    'Content/Items/Jobgear/Mechanic/mechanic_gear.xml',
    'Content/Items/Jobgear/Mechanic/mechanic_talent_items.xml',
    'Content/Items/Jobgear/Medic/medic_gear.xml',
    'Content/Items/Jobgear/Medic/medic_talent_items.xml',
    'Content/Items/Jobgear/misc.xml',
    'Content/Items/Jobgear/Security/securityofficer_gear.xml',
    'Content/Items/Jobgear/Security/securityofficer_talent_items.xml',
    'Content/Items/Jobgear/Watchman/watchman_gear.xml',
    'Content/Items/Labels/labels.xml',
    // 'Content/Items/Ladder/ladder.xml',
    'Content/Items/Legacy/legacycommand.xml',
    'Content/Items/Legacy/legacycontainers.xml',
    'Content/Items/Legacy/legacyengine.xml',
    'Content/Items/Legacy/legacyfabricators.xml',
    'Content/Items/Legacy/legacyoxygengenerator.xml',
    'Content/Items/Legacy/legacypoweritems.xml',
    'Content/Items/Legacy/legacypump.xml',
    'Content/Items/Legacy/legacyrailgun.xml',
    'Content/Items/Legacy/legacysearchlight.xml',
    'Content/Items/Materials/materials.xml',
    'Content/Items/Materials/medmaterials.xml',
    'Content/Items/Materials/minerals.xml',
    'Content/Items/Medical/buffs.xml',
    'Content/Items/Medical/medical.xml',
    'Content/Items/Medical/poisons.xml',
    'Content/Items/Misc/misc.xml',
    'Content/Items/OxygenGenerator/oxygengenerator.xml',
    'Content/Items/Pets/PetEggs.xml',
    'Content/Items/Pets/PetItems.xml',
    'Content/Items/Pump/pump.xml',
    'Content/Items/Reactor/reactor.xml',
    'Content/Items/SearchLight/searchlight.xml',
    // 'Content/Items/Shipwrecks/StructurePrefabsWrecked.xml',
    'Content/Items/Shipwrecks/wreckeditems.xml',
    'Content/Items/Tools/tools.xml',
    'Content/Items/Weapons/chaingun.xml',
    'Content/Items/Weapons/coilgun.xml',
    'Content/Items/Weapons/depthcharge.xml',
    'Content/Items/Weapons/dischargecoil.xml',
    'Content/Items/Weapons/explosives.xml',
    'Content/Items/Weapons/pulselaser.xml',
    'Content/Items/Weapons/railgun.xml',
    'Content/Items/Weapons/weapons.xml',
    'Content/Items/Weapons/turrethardpoint.xml',
]

interface RequiredItem {
    "$identifier": IdItemString
}

interface Fabricate {
    "RequiredSkill": {
        "$identifier": string,
        "$level": NumberString
    },
    "RequiredItem": RequiredItem | RequiredItem[],
    "$suitablefabricators": string,
    "$requiredtime": NumberString,
    "$amount"?: NumberString,
    "$displayname"?: string,
}

interface DeconstructItem {
    "$identifier": IdItemString,
    "$mincondition": NumberString,
    "$outcondition"?: NumberString
}

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
    "Fabricate"?: Fabricate | Fabricate[],
    "Deconstruct": {
        "Item": DeconstructItem[],
        "$time": NumberString
    },
    "InventoryIcon": {
        "$texture": string,
        "$sourcerect": NumbersWithComma,
        "$origin": NumbersWithComma
    },
    "Sprite": {
        "$texture": string,
        "$sourcerect": NumbersWithComma,
        "$origin": NumbersWithComma
    },
    "Body": any,
    "SuitableTreatment"?: any,
    "MeleeWeapon": any,
    "$name": "",
    "$identifier": IdItemString,
    "$variantof"?: IdItemString,
    "$category"?: string,
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

const items: Record<IdItemString, Item> = {}
const recipes: Record<string, Recipe> = {}

;
(async () => {
    for(const path of files) {
        try {
            const xml = await new Promise<Buffer>((resolve, reject) => readFile(join(BAROTRAUMA_DIR, path), (err, buffer) => err ? reject(err) : resolve(buffer)))
            const json = parser.parse(xml.toString())

            const {Item, ...namedRawItems} = json.Items
            const rawItems = [
                ...Object.entries(namedRawItems),
                ...((Array.isArray(Item) ? Item : []) as ItemRaw[])
                    .map((raw) => [raw.$identifier, raw] as const),
            ] as Array<[string, ItemRaw]>

            for(const [title, raw] of rawItems) {
                if(!raw.Price) {
                    console.warn(`No Price for "${title} (${raw.$identifier})" within "${path}", skipping..`)
                    continue
                }
                if(raw.$variantof) {
                    console.warn(`No variant handling. TODO. This was "${title} (${raw.$identifier})", variant of "${raw.$variantof}", skipping..`)
                    continue
                }

                // Source have both relative and absolute paths, normalize to absolute.
                // Also dev ofc codes on Windows, because few paths have messed up cases.
                const texture = (raw.InventoryIcon ?? raw.Sprite).$texture
                const iconPathNormalized = (texture.includes('/') ? texture : join(dirname(path), texture))
                    .replace('JobGear/', 'Jobgear/')

                items[raw.$identifier] = {
                    type: 'item',
                    id: raw.$identifier,
                    categories: (raw.$category || 'Uncategorized').split(','),
                    title,
                    price: Number(raw.Price.$baseprice),
                    icon: {
                        path: iconPathNormalized,
                        rect: (raw.InventoryIcon ?? raw.Sprite).$sourcerect.split(',').map(Number) as [number, number, number, number],
                    }
                }

                const fabricates: (Fabricate | undefined)[] = Array.isArray(raw.Fabricate) ? raw.Fabricate : [raw.Fabricate]
                if(raw.$identifier === 'chaingunammobox') console.log(fabricates)

                for(const fabricate of fabricates) {
                    const inputItems = !fabricate ? [] : Array.isArray(fabricate.RequiredItem) ? fabricate.RequiredItem : [fabricate.RequiredItem ?? []]
                    const outputItems = !raw.Deconstruct ? [] : Array.isArray(raw.Deconstruct.Item) ? raw.Deconstruct.Item : [raw.Deconstruct.Item ?? []]

                    const allItems: IdItemString[] = [...new Set([...inputItems, ...outputItems].map((item) => item.$identifier))]
                    if(allItems.length === 0) continue

                    const recipeId = `recipe-${raw.$identifier}${fabricate?.$displayname ? '-'+fabricate?.$displayname : ''}`
                    recipes[recipeId] = {
                        type: 'recipe',
                        id: recipeId,
                        result: raw.$identifier,
                        parts: allItems.map((id) => {
                            const inputItemCount = inputItems.filter((item) => item.$identifier === id).length
                            const amount = (fabricate?.$amount ? Number(fabricate?.$amount) : 1)
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
            }


        } catch(err) {
            (err as Error).message = (err as Error).message + ` (${path})`
            throw err
        }
    }

    // console.log(recipes)
    // for(const item of Object.values(items)) console.log(item)
    // for(const recipe of Object.values(recipes)) console.log(recipe)
    const itemsArray = Object.values(items)
    writeFileSync(join(OUT_DIR, 'items.json'), JSON.stringify(itemsArray))

    writeFileSync(join(OUT_DIR, 'recipes.json'), JSON.stringify(Object.values(recipes)))

    const iconPaths = new Set<string>()
    for(const item of itemsArray) iconPaths.add(item.icon.path)
    for(const icon of iconPaths.values()) {
        const srcPath = join(BAROTRAUMA_DIR, icon)
        const outPath = join(OUT_DIR, 'img', icon)
        console.log(icon, srcPath, outPath)
        mkdirSync(dirname(outPath), {recursive: true})
        copyFileSync(join(BAROTRAUMA_DIR, icon), outPath)
    }

// console.log(JSON.stringify(parsed.Items.Plastiseal))
})().catch((err: Error) => {
    console.error(err)
    process.exit(1)
})