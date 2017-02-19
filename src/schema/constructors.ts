import {
  tap, test, pipe as P, reject,
  propEq, evolve, unapply, apply,
  unnest, map, toPairs, prop, groupBy
} from 'ramda'
import { createTypeReference as ref } from '../types'
import parseType, { fixType, flagResolver } from './parseType'
import * as ts from 'typescript'
import * as t from '../types'

const pascal = require('pascal-case')
const arrify = unapply(unnest)
const byType = groupBy(prop('type'))

const typeMappings: { [key: string]: string } = {}
const tapType = ({predicate: p}: any, _: any) => typeMappings[p] = p
const tapUnion = ([key, types]: [any, any]) => {
  typeMappings[key] = `TMtp${key}`
  types.map(tapType)
}
const buildMappings = tap(P(
  P(byType, toPairs),
  map(tapUnion)
))

const buildParam = ({type, name}: any) => t.createPropertySignature(
  name,
  apply(ref, arrify(parseType(type, typeMappings))),
  test(flagResolver, type)
)

const buildType = ({predicate: p, params}: any) => t.createInterfaceDeclaration(
  p,
  [
    t.createPropertySignature(
      '_typeName',
      ts.createLiteral(`Telegram.type.${p}`)
    ),
    ...map(buildParam, params)
  ]
)

const buildUnion = ([key, types]: [any, any]) => map(t.createExport, [
  ...map(buildType, types),
  t.createTypeAliasDeclaration(
    `TMtp${key}`,
    t.createUnionType(map(P(prop('predicate'), ref), types))
  )
])

const prebuild = P(
  reject(propEq('predicate', 'vector')),
  map(evolve({
    predicate: pascal,
    type: fixType
  }))
)

const build = P<any, any, any, any, any, any, any>(
  prop('constructors'),
  prebuild,
  buildMappings,
  P(byType, toPairs),
  map(buildUnion),
  unnest
)

export const buildImports = P<any, any, any, any, any>(
  prop('constructors'),
  prebuild,
  buildMappings,
  () => typeMappings
)

export default build
