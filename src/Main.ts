/*
 * Charon compiler.
 */
import { Compiler } from './Compiler';

Compiler.compileFile('samples/sample.crn', undefined, { varargClosureBlocks: true });
Compiler.compileFile('samples/lib.crn');
Compiler.compileFile('samples/ent_test.crn', undefined, { embedRuntime: true });
Compiler.compileFile('samples/pootis_explode.crn', undefined, { embedRuntime: true });
