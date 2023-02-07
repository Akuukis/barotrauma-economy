declare type IdItemString = string
declare type IdCategoryString = string
declare type IdRecipeString = string
declare type NumberString = string
declare type BooleanString = string
declare type NumbersWithComma = string
declare type StringsWithComma = string

declare enum StoreIdentifierRaw {
    Outpost = "merchantoutpost",
    City = "merchantcity",
    Research = "merchantresearch",
    Military = "merchantmilitary",
    Mine = "merchantmine",
    Armory = "merchantarmory",  // special merchants?
    Engineering = "merchantengineering",  // special merchants?
    Medical = "merchantmedical",  // special merchants?
}

type StoreIdentifierType =
    | "outpost"
    | "city"
    | "research"
    | "military"
    | "mine"
    | "armory"  // special merchants?
    | "engineering"  // special merchants?
    | "medical"  // special merchants?

declare interface Item {
    type: 'item'
    id: IdItemString
    categories: IdCategoryString[]
    aliases?: string[]
    title: string
    price: number
    stores: Partial<Record<StoreIdentifierType, {
        id: StoreIdentifierType
        multiplier: number
        minavailable: number
        sold: boolean
    }>>
    icon: {
        path: string,
        rect: [number, number, number, number]
    }
}

declare interface RecipeDeconstruct {
    parts: Record<IdItemString, number>
}

declare interface RecipeFabricate {
    amount: number
    parts: Record<IdItemString, number>
}

declare interface Recipe {
    type: 'recipe'
    id: IdRecipeString
    result: IdItemString
    deconstruct: RecipeDeconstruct | null
    fabricate: RecipeFabricate[]
}
