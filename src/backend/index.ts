import os from 'os';

if(os.platform() == 'darwin')
  require('./index.darwin');
else
  require('./index.windows');
