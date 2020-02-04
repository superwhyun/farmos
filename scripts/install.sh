#!/bin/bash

echo -e '\n\n'
echo -e '    ______                                   _    _____ 
   / ____/___ __________ ___  ____  _____   | |  / /__ \
  / /_  / __ `/ ___/ __ `__ \/ __ \/ ___/   | | / /__/ /
 / __/ / /_/ / /  / / / / / / /_/ (__  )    | |/ // __/ 
/_/    \__,_/_/  /_/ /_/ /_/\____/____/     |___//____/ 
                                                        '

dirpath=`dirname $0`
echo -e $dirpath 
cd $dirpath
SHELL_PATH=`pwd -P`

echo -e '\n\n 1. apt update\n';sudo apt update
echo -e '\n\n 2. apt install -y build-essential\n';sudo apt install -y build-essential
echo -e '\n\n 3. apt install curl\n'; sudo apt install -y curl rdate

echo -e '\n\n 4. apt install python-pip\n'; sudo apt install -y python-pip
echo -e '\n\n 4-1. pip install --upgrade pip\n'; pip install --upgrade pip
echo -e '\n\n 4-2. pip install --upgrade setuptools\n'; pip uninstall -y distribute; pip install --upgrade setuptools
echo -e '\n\n 4-3. pip install requests\n'; pip install requests
echo -e '\n\n 4-4. pip install paho-mqtt\n'; pip install paho-mqtt
echo -e '\n\n 4-5. pip install pymysql\n'; pip install pymysql
echo -e '\n\n 4-6. pip install pymodbus\n'; pip install pymodbus
echo -e '\n\n 4-7. pip install simpleeval\n'; pip install simpleeval
echo -e '\n\n 4-8. pip install subprocess32\n'; pip install subprocess32

echo -e '\n\n 5. mysql check\n'
which mysql
if [ $? -eq 1 ];then
   echo -e "\n\n apt install mysql-server\n"; sudo apt install -y mysql-server 
   echo -e "\n\n systemctl start mysql\n"; sudo systemctl start mysql
   echo -e "\n\n systemctl enable mysql\n"; sudo systemctl enable mysql
else
    echo -e "mysql installed"
fi
echo -e "\nend"

echo -e '\n\n 6. node check\n'
which node
if [ $? -eq 1 ];then
    echo -e "apt purge node\n"; sudo apt purge node
fi


echo -e "curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -\n"; curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -;
echo -e "apt install -y nodejs\n"; sudo apt install -y nodejs
echo -e "npm install forever -g\n"; npm install forever -g
echo -e "\nend"

echo -e '\n\n 7. Mosquitto check\n'
which mosquitto
if [ $? -eq 1 ];then
   echo -e "\n\n apt install mosquitto\n"; sudo apt install -y mosquitto 
   echo -e "\nport 1883\nprotocol mqtt\n\nlistener 9001\nprotocol websockets" | sudo tee -a /etc/mosquitto/mosquitto.conf
   echo -e "\n\n sudo systemctl restart mosquitto\n"; sudo systemctl restart mosquitto
   sleep 2
   echo -e "\n\n sudo mosquitto -c /etc/mosquitto/mosquitto.conf -d\n"; sudo mosquitto -c /etc/mosquitto/mosquitto.conf -d
else
    echo -e "mosquitto installed"
fi
echo -e "\nend"

echo -e '\n\n 8. database script run \n'
sudo mysql -u root < farmos.sql

echo -e '\n\n 9. npm install \n'
npm --prefix ../server/modules/database.js install ../server/modules/database.js
npm --prefix ../server/api install ../server/api

echo -e '\n\n 10. ui installation \n'
cat << "EOF" > "fui"
#!/bin/bash

### BEGIN INIT INFO
# Provides:          farmos_ui
# Required-Start:    mysql
# Required-Stop:
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start daemon at boot time
# Description:       Enable farmos UI service provided by daemon.
### END INIT INFO

EOF

echo "WORK_DIR=\"${SHELL_PATH%/*}/server/api\"" >> fui

cat << "EOF" >> "fui"
cd "$WORK_DIR"

case "$1" in
  start)
    echo "Starting server"
    forever start --uid "farmosV2" -a "${WORK_DIR}/app.js"
    ;;
  stop)
    echo "Stopping server"
    forever stop farmosV2
    ;;
  *)
    echo "Usage: /etc/init.d/fui {start|stop}"
    exit 1
    ;;
esac
exit 0
EOF

sudo chmod +x fui
sudo mv fui /etc/init.d/fui

echo -e '\n\n 11. gate installation \n'
cat << "EOF" > "cvtgate"
#!/bin/bash

### BEGIN INIT INFO
# Provides:          farmos_gate
# Required-Start:    mysql
# Required-Stop:
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start daemon at boot time
# Description:       Enable farmos gate service provided by daemon.
### END INIT INFO

EOF

echo "WORK_DIR=\"${SHELL_PATH%/*}/gate\"" >> cvtgate

cat << "EOF" >> "cvtgate"
cd "$WORK_DIR"

case "$1" in
  start)
    echo -e "Starting server"
    python couplemng.py start
    ;;
  stop)
    echo -e "Stopping server"
    cd "$WORK_DIR"
    python couplemng.py stop
    ;;
  *)
    echo -e "Usage: /etc/init.d/cvtgate {start|stop}"
    exit 1
    ;;
esac
exit 0
EOF

sudo chmod +x cvtgate
sudo mv cvtgate /etc/init.d/cvtgate

echo -e '\n\n 12. core installation \n'
cat << "EOF" > "fcore"
#!/bin/bash

### BEGIN INIT INFO
# Provides:          farmos_core
# Required-Start:    mysql
# Required-Stop:
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start daemon at boot time
# Description:       Enable farmos core service provided by daemon.
### END INIT INFO

EOF

echo "WORK_DIR=\"${SHELL_PATH%/*}/fcore\"" >> fcore

cat << "EOF" >> "fcore"
cd "$WORK_DIR"

case "$1" in
  start)
    echo "Starting server"
    python fcore.py start
    ;;
  stop)
    echo "Stopping server"
    python fcore.py stop
    ;;
  *)
    echo "Usage: /etc/init.d/fcore {start|stop}"
    exit 1
    ;;
esac
exit 0
EOF

sudo chmod +x fcore
sudo mv fcore /etc/init.d/fcore

echo -e '\n\n 13. service run\n'

sudo /etc/init.d/fui start
sudo /etc/init.d/fcore start
sudo /etc/init.d/cvtgate start

sudo update-rc.d fui defaults
sudo update-rc.d fcore defaults
sudo update-rc.d cvtgate defaults
