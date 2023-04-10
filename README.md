# Hover DDNS nodejs impl

## How to set it up
### Clone this repository
```bash
git clone https://github.com/martian17/hover-ddns-js.git
cd hover-ddns-js
```
### Install node dependencies
```bash
npm install
```
or
```bash
pnpm install
```
### Write ddns.jsopn (config)
```json
{
    "example.com":[
        ["A","blog"],
        ["A","site"],
        ["A","vpn"]
    ]
}
```
### Install using make
This will setup a systemd service and enables it.
```bash
sudo make install
```
You can check the status of the service using the following command
```bash
systemctl status hover-ddns-js.service
```
### Uninstall using make
```bash
sudo make uninstall
```

