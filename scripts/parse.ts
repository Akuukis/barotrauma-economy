import { XMLParser } from "fast-xml-parser";
import { copyFileSync, mkdirSync, readFile, writeFileSync } from "fs";
import {join, dirname} from 'path'

// import { BooleanString, IdItemString, Item, NumberString, NumbersWithComma, Recipe, StringsWithComma } from "./common";
import '../src/common'


const BAROTRAUMA_DIR = '/media/kalvis/DataMuch/GamesSteam/steamapps/common/Barotrauma'
const OUT_DIR = join(__dirname, '..', 'dist')
const VENDOR_DIR = join(__dirname, '..', 'vendor')

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
    "$identifier"?: IdItemString
    "$amount"?: number
    "$count"?: number
    "$tag"?: string
    "$mincondition"?: string // between "0.0" to "0.95" and "1.0" and "1"
    "$maxcondition"?: string // between "0.0" to "0.95" and "1.0"
}

interface Fabricate {
    "RequiredSkill": {
        "$identifier"?: string,
        "$level": NumberString
    },
    "RequiredItem"?: RequiredItem | RequiredItem[],
    "Item"?: RequiredItem | RequiredItem[],
    "$suitablefabricators": string,
    "$requiresrecipe": BooleanString,
    "$requiredtime": NumberString,
    "$amount"?: NumberString,
    "$displayname"?: string,
}

interface DeconstructItem {
    "$identifier": IdItemString,
    "$mincondition": NumberString,
    "$outcondition"?: NumberString,
    "$commonness"?: NumberString
}

type Sprite =
    | Sprite.Rect
    | Sprite.Sheet
namespace Sprite {
    export interface Basis {
        "$texture": string
        "$origin": NumbersWithComma
    }
    export interface Rect extends Basis {
        "$sourcerect": NumbersWithComma
    }
    export interface Sheet extends Basis {
        "$sheetindex": NumbersWithComma
        "$sheetelementsize": NumbersWithComma
    }
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
            "$storeidentifier": StoreIdentifierRaw
            // "$locationtype": "outpost" | "city" | "research" | "military" | "mine"
            "$multiplier": NumberString,
            "$minavailable": NumberString
            "$sold"?: "false" | "true"
        }>,
        "$baseprice": NumberString
        "$minavailable": NumberString
        "$sold"?: "false"
        "$minleveldifficulty": NumberString
    },
    "Fabricate"?: Fabricate | Fabricate[]
    "Deconstruct"?: {
        "Item"?: DeconstructItem[]
        "$time": NumberString
        "$chooserandom"?: BooleanString
        "$amount"?: NumberString
    },
    "InventoryIcon"?: Sprite,
    "Sprite"?: Sprite,
    "sprite"?: Sprite,
    "Body": any,
    "SuitableTreatment"?: any,
    "MeleeWeapon": any,
    "$name": "",
    "$identifier": IdItemString,
    "$variantof"?: IdItemString,
    "$category"?: string,
    "$tags": StringsWithComma,
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

function getIconRectFromSheet(icon: Sprite.Sheet): [number, number, number, number] {
    const size = icon.$sheetelementsize.split(',').map(Number) as [number, number]
    const topLeft = icon.$sheetindex.split(',').map(Number).map((coord, i) => coord * size[i]) as [number, number]
    return [
        ...topLeft,
        ...size,
    ]
}
/**
 * Source have both relative and absolute paths, normalize to absolute.
 * Also dev ofc codes on Windows, because few paths have messed up cases.
 * 
 * ```xml
 * <InventoryIcon texture="Content/Items/Genetic/Genetic.png" sourcerect="244,62,76,65" origin="0.5,0.5" />
 * <Sprite name="Headset" texture="Content/Items/Genetic/Genetic.png" depth="0.6" sourcerect="67,85,73,35" origin="0.5,0.5" />
 * ```
 * or
 * ```xml
 * <InventoryIcon texture="Content/Items/Genetic/Genetic.png" sheetindex="0,3" sheetelementsize="64,64" origin="0.5,0.5" />
 * <Sprite texture="Content/Items/Genetic/Genetic.png" sheetindex="11,0" sheetelementsize="32,32" depth="0.6" origin="0.5,0.5"/>
 * ```
 * 
 */
function getIcon(raw: ItemRaw, path: string) {
    const icon = (raw.InventoryIcon ?? raw.Sprite ?? raw.sprite)!
    const texture = icon.$texture
    const iconPathNormalized = (texture.includes('/') ? texture : join(dirname(path), texture))
        .replace('JobGear/', 'Jobgear/')
        .replace('Defensebot.png', 'DefenseBot.png')

    const rectNormalized = '$sourcerect' in icon
        ? icon.$sourcerect.split(',').map(Number) as [number, number, number, number]
        : getIconRectFromSheet(icon)

    return {
        path: iconPathNormalized,
        rect: rectNormalized,
    }
}

const registryAliases = {
    clothes: [] as string[],
    uniform: [] as string[],
    wire: [] as string[],
    component: [] as string[],
}
/**
 * Bloat only adds noise, so group very similar items.
 */
function assignGroup(item: Item): Item {
    // Group clothes
    if(item.id.includes('clothes')) {
        registryAliases.clothes.push(item.id)
        return {...item, id: 'clothes', title: `Clothes (${registryAliases.clothes.length})`, aliases: registryAliases.clothes} as Item
    }
    // Group uniform and jumpsuits
    if(item.id.includes('uniform') || item.id.includes('jumpsuit')) {
        registryAliases.uniform.push(item.id)
        return {...item, id: 'uniform', title: `Uniforms (${registryAliases.uniform.length})`, aliases: registryAliases.uniform} as Item
    }
    // Group wires
    if(item.id.includes('wire')) {
        registryAliases.wire.push(item.id)
        return {...item, id: 'wire', title: `Wires (${registryAliases.wire.length})`, aliases: registryAliases.wire} as Item
    }
    // Group components
    if(item.id.includes('component') && !item.id.includes('lightcomponent')) {
        registryAliases.component.push(item.id)
        return {...item, id: 'component', title: `Components (${registryAliases.component.length})`, aliases: registryAliases.component} as Item
    }

    return item
}


(async () => {
    for(const path of files) {
        try {
            const xml = await new Promise<Buffer>((resolve, reject) => readFile(join(BAROTRAUMA_DIR, path), (err, buffer) => err ? reject(err) : resolve(buffer)))
            writeFileSync(join(VENDOR_DIR, path.replace(/\//g, '-')), xml)
            const json = parser.parse(xml.toString())

            const {Item, ...namedRawItems} = json.Items
            const rawItems = [
                ...Object.entries(namedRawItems),
                ...((Array.isArray(Item) ? Item : []) as ItemRaw[])
                    .map((raw) => [raw.$identifier, raw] as const),
            ] as Array<[string, ItemRaw]>

            for(const [title, raw] of rawItems.slice()) {
                let conditionable = false
                if(raw.Deconstruct?.Item) {
                    const itemsRaw = !raw.Deconstruct?.Item ? [] : Array.isArray(raw.Deconstruct.Item) ? raw.Deconstruct.Item : [raw.Deconstruct.Item ?? []]
                    for(const itemRaw of itemsRaw) {
                        if(itemRaw.$mincondition) conditionable = true
                    }
                }
                const fabricatesRaw: (Fabricate | undefined)[] = !raw.Fabricate ? [] : Array.isArray(raw.Fabricate) ? raw.Fabricate : [raw.Fabricate]
                for(const fabricateRaw of fabricatesRaw) {
                    if(!fabricateRaw) continue
                    const normalizedItem = (fabricateRaw.RequiredItem ?? fabricateRaw.Item)!
                    const itemsRaw = Array.isArray(normalizedItem) ? normalizedItem : normalizedItem ? [normalizedItem] : []
                    if(itemsRaw.length === 0) continue
                    for(const itemRaw of itemsRaw) {
                        if(itemRaw.$mincondition) conditionable = true
                        if(itemRaw.$mincondition) conditionable = true
                    }
                }

                if(conditionable) {
                    rawItems.push([
                        title + ' (empty)',
                        {
                            ...raw,
                            $identifier: raw.$identifier+'-empty',
                        }
                    ])
                }
            }



            for(const [title, raw] of rawItems) {
                try {
                    if(!raw.Price && !raw.Deconstruct) {
                    // console.warn(`No Price for "${title} (${raw.$identifier})" within "${path}", skipping..`)
                        continue
                    }
                    if(raw.$variantof) {
                        console.warn(`No variant handling. TODO. This was "${title} (${raw.$identifier})", variant of "${raw.$variantof}", skipping..`)
                        continue
                    }
                    const empty = raw.$identifier.includes('-empty')

                    const item = assignGroup({
                        type: 'item',
                        id: raw.$identifier,
                        categories: (raw.$category?.split(',') || []).concat((raw.$tags?.split(',') || [])).concat(...path.replace('Content/Items/', '').replace('.xml', '').split('/')),
                        title,
                        price: empty ? 0 : Number(raw.Price?.$baseprice ?? 0),
                        icon: getIcon(raw, path),
                        stores: empty ? {} : (raw.Price?.Price && (Array.isArray(raw.Price.Price) ? raw.Price.Price : [raw.Price.Price]))?.map((rawPrice) => ({
                            id: rawPrice.$storeidentifier.slice('merchant'.length) as StoreIdentifierType,
                            multiplier: Number(rawPrice.$multiplier ?? 1),
                            minavailable: Number(rawPrice.$minavailable ?? 0),
                            sold: rawPrice.$sold === 'false' ? false : true,
                        })).reduce((obj, e) => ({...obj, [e.id]: e}), {} as Item['stores']) ?? {}
                    })
                    items[item.id] = item

                    const fabricatesRaw: (Fabricate | undefined)[] = !raw.Fabricate ? [] : Array.isArray(raw.Fabricate) ? raw.Fabricate : [raw.Fabricate]

                    const deconstruct = {
                        parts: {} as Record<IdItemString, number>
                    }
                    if(raw.Deconstruct?.Item) {
                        const itemsRaw = !raw.Deconstruct?.Item ? [] : Array.isArray(raw.Deconstruct.Item) ? raw.Deconstruct.Item : [raw.Deconstruct.Item ?? []]
                        const lotteryTotalWeight = raw.Deconstruct.$chooserandom ? itemsRaw.reduce((sum, item) => sum + Number(item.$commonness!), 0) / Number(raw.Deconstruct.$amount ?? 1) : 1

                        for(const itemRaw of itemsRaw) {
                            if(empty && parseFloat(itemRaw.$mincondition ?? "0") >= 0.9) continue
                            const id = itemRaw.$identifier
                            const condition = Number(itemRaw.$outcondition) || 1
                            const lotteryWeight = Number(itemRaw.$commonness ?? 1) / lotteryTotalWeight
                            deconstruct.parts[id] = Math.round(((deconstruct.parts[id] ?? 0) + condition * lotteryWeight) * 100) / 100
                        }
                    }

                    const fabricate: RecipeFabricate[] = []
                    if(!empty) {
                        for(const fabricateRaw of fabricatesRaw) {
                            if(!fabricateRaw) continue
                            const normalizedItem = (fabricateRaw.RequiredItem ?? fabricateRaw.Item)!
                            const itemsRaw = Array.isArray(normalizedItem) ? normalizedItem : normalizedItem ? [normalizedItem] : []
                            if(itemsRaw.length === 0) continue

                            const fabricateInner = {
                                amount: Number(fabricateRaw?.$amount ?? 1),
                                parts: {} as Record<IdItemString, number>,
                                ...(fabricateRaw.$requiresrecipe ? {talent: true as const} : {}),
                                ...(fabricateRaw.RequiredSkill ? {skill: {
                                    id: fabricateRaw.RequiredSkill.$identifier!,
                                    level: Number(fabricateRaw.RequiredSkill.$level),
                                }} : {}),
                            }
                            for(const itemRaw of itemsRaw) {
                                const id = (itemRaw.$identifier ?? itemRaw.$tag)!.replace(item.id, `${item.id}-empty`)
                                const requiredAmount = Number(itemRaw?.$amount ?? itemRaw?.$count ?? 1)
                                fabricateInner.parts[id] = (fabricateInner.parts[id] ?? 0) + requiredAmount
                            }

                            if(Object.keys(fabricateInner.parts).length) fabricate.push(fabricateInner)
                        }
                    } else {
                        fabricate.push({ amount: 1, parts: { [item.id.replace('-empty', '')]: 1 } as Record<IdItemString, number> })
                    }

                    const recipeId = `recipe-${item.id}`
                    recipes[recipeId] = {
                        type: 'recipe',
                        id: recipeId,
                        result: item.id,
                        deconstruct: Object.keys(deconstruct.parts).length ? deconstruct : null,
                        fabricate,
                    }

                } catch(err) {
                    (err as Error).message = (err as Error).message + ` [${title}]`
                    throw err
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
    const itemsArray = Object.values(items).sort((a, b) => a.id < b.id ? -1 : 1)
    writeFileSync(join(OUT_DIR, 'items.json'), JSON.stringify(itemsArray))
    writeFileSync(join(VENDOR_DIR, 'items.json'), JSON.stringify(itemsArray, undefined, 2))

    const recipesArray = Object.values(recipes).sort((a, b) => a.id < b.id ? -1 : 1)
    writeFileSync(join(OUT_DIR, 'recipes.json'), JSON.stringify(recipesArray))
    writeFileSync(join(VENDOR_DIR, 'recipes.json'), JSON.stringify(recipesArray, undefined, 2))

    const iconPaths = new Set<string>()
    for(const item of itemsArray) iconPaths.add(item.icon.path)
    for(const icon of iconPaths.values()) {
        const srcPath = join(BAROTRAUMA_DIR, icon)
        const outPath = join(OUT_DIR, 'img', icon)
        mkdirSync(dirname(outPath), {recursive: true})
        copyFileSync(srcPath, outPath)
    }

// console.log(JSON.stringify(parsed.Items.Plastiseal))
})().catch((err: Error) => {
    console.error(err)
    process.exit(1)
})