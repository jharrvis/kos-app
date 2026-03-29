import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { Request, Response, Headers } from 'node-fetch'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder
global.Request = Request as unknown as typeof global.Request
global.Response = Response as unknown as typeof global.Response
global.Headers = Headers as unknown as typeof global.Headers
