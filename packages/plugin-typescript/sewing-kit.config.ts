import {createPackage, Runtime} from '@sewing-kit/config';
import {createSewingKitPackagePlugin} from '../../config/sewing-kit';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.entry({root: './src/index'});
  pkg.entry({
    name: 'babel-plugin-convert-empty-file-to-esmodule',
    root: './src/babel-plugin-convert-empty-file-to-esmodule',
  });
  pkg.use(createSewingKitPackagePlugin());
});
