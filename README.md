# OverrideDNDShop
A DM Tool for Item Management for Stores. Written for Override for use in their DM campeigns. You can enter in your items players can buy with cooldowns and then generate a store page for that day. Every time a new day is generated the cooldown is reduced.  

This was also a test to see how much the new agent mode in VS Code could do by itself. 


Will continue this write up. Later.
A public  version is available at https://dndshop.sveken.com/ 

Data is stored locally in your browser cache, there is also a backup and restore function in settings.


```
services:
  OverrideDNDShop:
    image: ghcr.io/sveken/overridedndshop:main
    ports:
      - "8080:8080"
    restart: always
```