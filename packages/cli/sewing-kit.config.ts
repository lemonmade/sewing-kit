import {createPackage, Runtime} from '@sewing-kit/config';
import {createSewingKitPackagePlugin} from '../../config/sewing-kit';

export default createPackage((pkg) => {
  pkg.runtime(Runtime.Node);
  pkg.entry({root: './src/index'});
  pkg.binary({name: 'sewing-kit', root: './src/cli', aliases: ['sk']});
  pkg.use(createSewingKitPackagePlugin());
});
