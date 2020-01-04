import esnext from './config/esnext';
import typescript from './config/typescript';
import react from './config/react';
import graphql from './config/graphql';
import jest from './config/jest';
import node from './config/node';
import prettier from './config/prettier';

export {rules} from './rules';

export const configs = {
  // Core configs - When extending, one of these should go first
  esnext,
  typescript,

  // Augmenting configs - When extending, these go after the core config
  react,
  graphql,
  jest,
  node,
  prettier,
};
