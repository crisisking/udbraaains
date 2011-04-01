from datetime import datetime, timedelta;

long_ago = datetime.utcnow() - timedelta(100,100,100);

class UDSurvivorDBEntry :
    def __init__(self, i) :
        self.id = i;
        self.last_seen_time = long_ago;
        self.last_seen_location = 0;
        self.last_seen_by = 0;
        self.known = False;
        self.color = '#000000';
    def dump(self) :
        print("player id " + str(self.id) + " last seen at " + str(self.location) + " ("+str(self.last_seen_time)+
              " by "+str(self.last_seen_by)+") "+str(self.known)+" "+str(self.color));


class UDSurvivorDB :
    def __init__(self) :
        self.db = {};

    def post_load(self) :
        return
        #for x in self.db :
            #self.db[x].name = '';
            #self.db[x].note = '';
            #self.db[x].added_by_addr = 0;

    def update_pos(self, id, timestamp, location, witness) :
        if self.db.has_key(id) :
            K = self.db[id];
        else :
            K = UDSurvivorDBEntry(id);
            self.db[id] = K;
        #K.dump();
        K.last_seen_time = timestamp;
        K.last_seen_location = location;
        K.last_seen_by = witness;
        return (id, K.known, K.color);

    def get(self, id) :
        if self.db.has_key(id) :
            return self.db[id];
        else :
            return None

    def know_survivor(self, id, color, address) :
        if self.db.has_key(id) :
            K = self.db[id];
        else :
            K = UDSurvivorDBEntry(id);
            self.db[id] = K;
        #K.dump();
        K.known = True;
        K.color = color;
        K.added_by_addr = address;

    def get_count(self) :
        return len(self.db);

