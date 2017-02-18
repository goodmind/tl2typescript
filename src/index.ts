#!/usr/bin/env node

import * as ts from 'typescript'
import buildM from './schema/methods'
import build from './schema/constructors'

const schema = require('../schema.json')
const commonTypes =
`import { A, B, C } from './types'
export interface IMtpVector<T> {
  list: T[]
}
type double = number
type long = number
type bytes = any`

const args = process.argv.slice(2)
const mode = args[0]

const printer = ts.createPrinter({
  target: ts.ScriptTarget.ES5
})

const schemaAst = mode === 'methods' ? buildM(schema) : build(schema)
const sourceFile = ts.createSourceFile(`${mode}.d.ts`, commonTypes, ts.ScriptTarget.ES5)
const ast = Object.assign({}, sourceFile, {
  statements: [
    ...sourceFile.statements,
    ...schemaAst
  ]
})

console.log(printer.printFile(ast))
