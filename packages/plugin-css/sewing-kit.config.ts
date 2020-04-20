import {createPackage, Runtime} from '@sewing-kit/config';
import {createSewingKitPackagePlugin} from '../../config/sewing-kit';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.entry({name: 'postcss-preset', root: './src/postcss-preset'});
  pkg.use(createSewingKitPackagePlugin());
});
