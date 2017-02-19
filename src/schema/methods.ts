import {
  tap, values, uniq, test, or,
  pipe as P, reject, propEq, evolve,
  unapply, unnest, map, toPairs, prop,
  groupBy, converge, of, useWith, always, apply
} from 'ramda'
import { createTypeReference as ref } from '../types'
import parseType, { fixType, flagResolver } from './parseType'
import { buildImports } from './constructors'
import * as ts from 'typescript'
import * as t from '../types'

const pascal = require('pascal-case')
const arrify = unapply(unnest)
const byType = groupBy(prop('type'))

let importMappings: { [key: string]: string } = {}
const typeMappings: { [key: string]: string } = {}
const tapType = ({method: m}: any, _: any, types: any) => typeMappings[m] = types.length === 1 ? m : `TMtp${m}`
const tapUnion = ([_, types]: [any, any]) => types.map(tapType)
const buildMappings = tap(P(
  P(byType, toPairs),
  map(tapUnion)
))

const buildParam = ({type, name}: any) => t.createPropertySignature(
  name,
  apply(ref, arrify(parseType(type, typeMappings, importMappings))),
  or(test(flagResolver, type), name === 'flags')
)

const buildType = ({method: m, params}: any) => t.createInterfaceDeclaration(m, map(buildParam, params))
const buildUnion = ([_, types]: [any, any]) => map(P(buildType, t.createExport), types)

const prebuild = P(
  reject(propEq('method', 'vector')),
  map(evolve({
    method: pascal,
    type: fixType
  }))
)

const build = P<any, any, any, any, any, any, any>(
  prop('methods'),
  prebuild,
  buildMappings,
  P(byType, toPairs),
  map(buildUnion),
  unnest
)

const buildReturnType = ({method: m, type}: any) => t.createPropertySignature(
  ts.createLiteral(m),
  apply(ref, arrify(parseType(type, typeMappings, importMappings)))
)
const buildReturnTypes = P<any, any, any, any, any, any>(
  prop('methods'),
  P(byType, toPairs),
  map(([_, types]: [any, any]) => map(buildReturnType, types)),
  unnest,
  params => t.createExport(t.createInterfaceDeclaration('ReturnTypes', params))
)

const buildParamsType = ({method: m}: any) => t.createPropertySignature(
  ts.createLiteral(m),
  ref(pascal(m))
)
const buildParamsTypes = P<any, any, any, any, any, any>(
  prop('methods'),
  P(byType, toPairs),
  map(([_, types]: [any, any]) => map(buildParamsType, types)),
  unnest,
  params => t.createExport(t.createInterfaceDeclaration('ParamsTypes', params))
)

const buildWithImports = converge(arrify, [
  converge(
    useWith(P(t.createImports, of), of(P(values, uniq))),
    [
      schema => importMappings = buildImports(schema),
      always('./types')
    ]
  ),
  build,
  buildParamsTypes,
  buildReturnTypes
])

export default buildWithImports
