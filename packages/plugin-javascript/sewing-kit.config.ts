import {createPackage, Runtime} from '@sewing-kit/config';
import {createSewingKitPackagePlugin} from '../../config/sewing-kit';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.entry({name: 'babel-preset', root: './src/babel-preset'});
  pkg.use(createSewingKitPackagePlugin());
});
