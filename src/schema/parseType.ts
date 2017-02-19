import { Pred, T, identity, cond, replace, anyPass, equals, always, test, pipe as P, match, nth, prop, propEq, useWith } from 'ramda'
import { createTypeReference as ref } from '../types'

const upperCaseFirst = require('upper-case-first')
export const fixType = P(replace('.', '$'), upperCaseFirst)
export const typeResolver = /^([\#!%\.\w\?]+)(<([%\.\w]+)>)?$/
export const flagResolver = /^flags\.(\d+)\?([%\.\w<>]+)$/

const matchNum: [Pred<string>, (v: string) => any] = [
  anyPass([
    equals('#'),
    equals('int')
  ]),
  always('number')
]

const matchFlag: [Pred<string>, (v: string) => any] = [
  test(flagResolver),
  useWith(
    (a, t, i) => parseType(a, t, i),
    [P(match(flagResolver), nth(2))]
  )
]

const matchVector: [Pred<string>, (v: string) => any] = [
  P(match(typeResolver), propEq(1, 'Vector')),
  useWith(
    (T, t, i) => ['IMtpVector', [ref(parseType(T, t, i))]],
    [P(match(typeResolver), prop('3'))]
  )
]

const getTypeName = P(match(typeResolver), prop('1'))
const matchType: [Pred<string>, (v: string) => any] = [
  P(getTypeName, test(/[A-Z].*/g)),
  useWith(
    (x: string, types: any, imports: any) => types[x] || imports[x] || 'any',
    [P(getTypeName, fixType)]
  )
]

const parseType: any = cond<string, any>([
  matchNum,
  matchFlag,
  matchVector,
  matchType,
  [T, identity]
])

export default parseType
