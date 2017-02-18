import { T, tap, identity, anyPass, nth, match, test, equals, always, cond, pipe, replace, reject, propEq, evolve, unapply, unnest, map, toPairs, prop, groupBy } from 'ramda'
import { createTypeReference as ref } from '../types'
import * as t from '../types'

const upperCaseFirst = require('upper-case-first')
const pascal = require('pascal-case')
const typeResolver = /^([\#!%\.\w\?]+)(<([%\.\w]+)>)?$/
const flagResolver = /^flags\.(\d+)\?([%\.\w<>]+)$/
const fixType = pipe(replace('.', '$'), upperCaseFirst)
const arrify = unapply(unnest)
const byType = groupBy(prop('type'))

const typeMappings: { [key: string]: string } = {}
const tapType = ({method: m}: any, _: any, types: any) => typeMappings[m] = types.length === 1 ? m : `TMtp${m}`
const tapUnion = ([_, types]: [any, any]) => {
  // typeMappings[key] = types.length === 1 ? pascal(key) : `TMtp${key}`
  types.map(tapType)
}
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
    pipe(match(typeResolver), prop('1'), fixType, (x: string) => typeMappings[x] || `Unknown<${x}>`)
  ],
  [T, identity]
])

const buildParam = (param: any) => t.createPropertySignature(
  param.name,
  ref(...arrify(parseType(param.type))),
  test(flagResolver, param.type)
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

export default build
