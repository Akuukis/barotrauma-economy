declare type IdItemString = string
declare type IdCategoryString = string
declare type IdRecipeString = string
declare type NumberString = string
declare type BooleanString = string
declare type NumbersWithComma = string
declare type StringsWithComma = string

declare interface Item {
    type: 'item'
    id: IdItemString
    categories: IdCategoryString[]
    title: string
    price: number
    icon: {
        path: string,
        rect: [number, number, number, number]
    }
}

declare interface Recipe {
    type: 'recipe'
    id: IdRecipeString
    result: IdItemString
    parts: Array<{
        id: IdItemString
        input: number
        output: number
    }>,
}
