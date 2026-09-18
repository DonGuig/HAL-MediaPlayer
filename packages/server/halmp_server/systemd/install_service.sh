sudo cp halmp.service /lib/systemd/system/
sudo cp halmp-OSCserver.service /lib/systemd/system/
sudo cp black_shell.service /lib/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable halmp.service && systemctl start halmp.service
sudo systemctl enable halmp-OSCserver.service && systemctl start halmp-OSCserver.service
sudo systemctl enable black_shell.service && systemctl start black_shell.service