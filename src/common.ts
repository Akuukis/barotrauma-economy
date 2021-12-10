declare type IdString = string
declare type NumberString = string
declare type BooleanString = string
declare type NumbersWithComma = string
declare type StringsWithComma = string

declare interface Item {
    id: IdString
    type: 'item'
    title: string
    price: number
}

declare interface Recipe {
    id: IdString
    type: 'recipe'
    parts: Array<{
        id: IdString
        input: number
        output: number
    }>,
}
