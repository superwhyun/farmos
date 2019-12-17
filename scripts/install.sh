echo '\n\n'
echo '    ______                                   _    _____ 
   / ____/___ __________ ___  ____  _____   | |  / /__ \
  / /_  / __ `/ ___/ __ `__ \/ __ \/ ___/   | | / /__/ /
 / __/ / /_/ / /  / / / / / / /_/ (__  )    | |/ // __/ 
/_/    \__,_/_/  /_/ /_/ /_/\____/____/     |___//____/ 
                                                        '

dirpath=`dirname $0`
echo $dirpath 
cd $dirpath
SHELL_PATH=`pwd -P`

echo '\n\n 1. apt update\n';sudo apt update
echo '\n\n 2. apt install -y build-essential\n';sudo apt install -y build-essential
echo '\n\n 3. apt install curl\n'; sudo apt install -y curl

echo '\n\n 4. apt install python-pip\n'; sudo apt install -y python-pip
echo '\n\n 4-1. pip install requests\n'; pip install requests
echo '\n\n 4-2. pip install pypaho-mqtt\n'; pip install paho-mqtt
echo '\n\n 4-3. pip install pymysql\n'; pip install pymysql
echo '\n\n 4-4. pip install pymodbus\n'; pip install pymodbus


echo '\n\n 5. mysql check\n'
which mysql
if [ $? -eq 1 ];then
   echo "\n\n apt install mysql-server\n"; sudo apt install -y mysql-server 
   echo "\n\n systemctl start mysql\n"; sudo systemctl start mysql
   echo "\n\n systemctl enable mysql\n"; sudo systemctl enable mysql
else
    echo "mysql installed"
fi
echo "\nend"

echo '\n\n 6. node check\n'
which node
if [ $? -eq 1 ];then
    echo "apt purge node\n"; sudo apt purge node
fi


echo "curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -\n"; curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -;
echo "apt install -y nodejs\n"; sudo apt install -y nodejs
echo "npm install pm2 -g\n"; npm install pm2 -g
echo "\nend"

echo '\n\n 7. Mosquitto check\n'
which mosquitto
if [ $? -eq 1 ];then
   echo "\n\n apt install mosquitto\n"; sudo apt install -y mosquitto 
   echo "\nport 1883\nprotocol mqtt\n\nlistener 9001\nprotocol websockets" | sudo tee -a /etc/mosquitto/mosquitto.conf
   echo "\n\n sudo systemctl restart mosquitto\n"; sudo systemctl restart mosquitto
   sleep 2
   echo "\n\n sudo mosquitto -c /etc/mosquitto/mosquitto.conf -d\n"; sudo mosquitto -c /etc/mosquitto/mosquitto.conf -d
else
    echo "mosquitto installed"
fi
echo "\nend"

echo '\n\n 8. database script run \n'
sudo mysql -u root < farmos.sql

echo '\n\n 9. npm install \n'
npm --prefix ../server/modules/database.js install ../server/modules/database.js
npm --prefix ../server/api install ../server/api

echo '\n\n 10. server run \n'
sudo pm2 stop farmosV2
cd ${SHELL_PATH%/*}/server/api
sudo pm2 start ${SHELL_PATH%/*}/server/api/app.js -- name farmosV2
sudo pm2 startup
sudo pm2 save

echo '\n\n 11. gate run \n'
sudo mkdir /etc/rc.local
echo "python ${SHELL_PATH%/*}/gate/couplemng.py" > ./couplemng.sh | sudo mv couplemng.sh /etc/rc.local/couplemng.sh
python ${SHELL_PATH%/*}/gate/couplemng.py start

