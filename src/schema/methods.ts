import {
  T, tap, identity, anyPass, nth, values, uniq,
  match, test, equals, always, cond, or,
  pipe, replace, reject, propEq, evolve,
  unapply, unnest, map, toPairs, prop, groupBy
} from 'ramda'
import { createTypeReference as ref } from '../types'
import { buildImports } from './constructors'
import * as ts from 'typescript'
import * as t from '../types'

const upperCaseFirst = require('upper-case-first')
const pascal = require('pascal-case')
const typeResolver = /^([\#!%\.\w\?]+)(<([%\.\w]+)>)?$/
const flagResolver = /^flags\.(\d+)\?([%\.\w<>]+)$/
const fixType = pipe(replace('.', '$'), upperCaseFirst)
const arrify = unapply(unnest)
const byType = groupBy(prop('type'))

let importMappings: { [key: string]: string } = {}
const typeMappings: { [key: string]: string } = {}
const tapType = ({method: m}: any, _: any, types: any) => typeMappings[m] = types.length === 1 ? m : `TMtp${m}`
const tapUnion = ([_, types]: [any, any]) => types.map(tapType)
const buildMappings = tap(pipe(
  pipe(byType, toPairs),
  map(tapUnion)
))

let parseType: any = cond<string, any>([
  [anyPass([
    equals('#'),
    equals('int')
  ]), always('number')],
  [
    test(flagResolver),
    pipe(
      match(flagResolver),
      nth(2),
      a => parseType(a))],
  [
    pipe(match(typeResolver), propEq(1, 'Vector')),
    pipe(
      match(typeResolver),
      prop('3'),
      (T) => ['IMtpVector', [ref(parseType(T))]])
  ],
  [
    pipe(match(typeResolver), prop('1'), test(/[A-Z].*/g)),
    pipe(
      match(typeResolver),
      prop('1'),
      fixType,
      (x: string) => typeMappings[x] || importMappings[x] || 'any'
    )
  ],
  [T, identity]
])

const buildParam = (param: any) => t.createPropertySignature(
  param.name,
  ref(...arrify(parseType(param.type))),
  or(test(flagResolver, param.type), param.name === 'flags')
)

const buildType = ({method: m, params}: any) => t.createInterfaceDeclaration(m, map(buildParam, params))
const buildUnion = ([_, types]: [any, any]) => map(t.createExport, map(buildType, types))

const prebuild = pipe(
  reject(propEq('method', 'vector')),
  map(evolve({
    method: pascal,
    type: fixType
  }))
)

const build = pipe<any, any, any, any, any, any, any>(
  prop('methods'),
  prebuild,
  buildMappings,
  pipe(byType, toPairs),
  map(buildUnion),
  unnest
)

const buildReturnType = ({method: m, type}: any) => t.createPropertySignature(
  ts.createLiteral(m),
  ref(...arrify(parseType(type)))
)
const buildReturnTypes = pipe<any, any, any, any, any, any>(
  prop('methods'),
  pipe(byType, toPairs),
  map(([_, types]: [any, any]) => map(buildReturnType, types)),
  unnest,
  params => t.createExport(t.createInterfaceDeclaration('ReturnTypes', params))
)

const buildParamsType = ({method: m}: any) => t.createPropertySignature(
  ts.createLiteral(m),
  ref(pascal(m))
)
const buildParamsTypes = pipe<any, any, any, any, any, any>(
  prop('methods'),
  pipe(byType, toPairs),
  map(([_, types]: [any, any]) => map(buildParamsType, types)),
  unnest,
  params => t.createExport(t.createInterfaceDeclaration('ParamsTypes', params))
)

const buildWithImports = (schema: any) => {
  importMappings = buildImports(schema)
  const imports = t.createImports(uniq(values(importMappings)), './types')
  const params = build(schema)
  const paramsTypes = buildParamsTypes(schema)
  const returnTypes = buildReturnTypes(schema)
  return [
    imports,
    ...params,
    ...paramsTypes,
    ...returnTypes
  ]
}

export default buildWithImports
