from UDUserDB import UDUserDB, UDUserDBEntry
import shelve
from datetime import datetime,timedelta
import Numeric;
import sys;


def age(now, before) :
    delta = now - before;
    return str(delta.seconds + 86400*delta.days)

if len(sys.argv) == 1 :
    name = "udb_shelf"
else :
    name = sys.argv[1];

my_shelf = shelve.open(name,flag='r', writeback=False);

if not my_shelf.has_key('user_db') :
    sys.exit(-1);
    
user_db = my_shelf["user_db"];
now = datetime.utcnow();

burbs = Numeric.zeros((10,10));
for x in user_db.db :
    u = user_db.get_user(x);
    y = u.last_location % 100;
    x = (u.last_location - y)/100;
    if now - u.last_connect_time < timedelta(days=2) :
        burbs[y//10,x//10] = burbs[y//10,x//10] + 1;
        print(str(u.id)+"\t"+str(x)+"\t"+str(y)+"\t"+
              age(now, u.last_connect_time)+"\t"+str(u.address));
#    print(str(u.id)+"\t"+str(u.address));

print burbs

        
