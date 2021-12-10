declare type IdItemString = string
declare type IdRecipeString = string
declare type NumberString = string
declare type BooleanString = string
declare type NumbersWithComma = string
declare type StringsWithComma = string

declare interface Item {
    id: IdItemString
    type: 'item'
    title: string
    price: number
}

declare interface Recipe {
    id: IdRecipeString
    result: IdItemString
    type: 'recipe'
    parts: Array<{
        id: IdItemString
        input: number
        output: number
    }>,
}
