import {ReflectionCapabilities} from './reflection_capabilities';
import {Reflector} from './reflector';

export {ReflectionInfo, Reflector} from './reflector';


/**
 * The {@link Reflector} used internally in Angular to access metadata
 * about symbols.
 */
export var reflector = new Reflector(new ReflectionCapabilities());
