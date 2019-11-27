import {createPackage, Runtime} from '@sewing-kit/config';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.entry({root: './src/index'});
  pkg.entry({root: './src/load', name: 'load'});
});
