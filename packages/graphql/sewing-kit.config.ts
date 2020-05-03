import {createPackage, Runtime} from '@sewing-kit/config';
import {createSewingKitPackagePlugin} from '../../config/sewing-kit';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.entry({root: './src/index'});
  pkg.entry({name: 'jest', root: './src/jest-transform'});
  pkg.entry({name: 'jest-simple', root: './src/jest-transform-simple'});
  pkg.entry({name: 'webpack', root: './src/webpack-loader'});
  pkg.use(createSewingKitPackagePlugin());
});
