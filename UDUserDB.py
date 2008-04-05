class UDUserDBEntry :
    def __init__(self, i) :
        self.id = i;
        self.last_connect_time = long_ago;
        self.last_location = 0;
        self.address = '';

    def dump(self) :
        print("player id " + str(self.id) + " last seen at " + str(self.last_location) +
              " ("+str(self.last_connect_time) + " from IP " + str(self.address));
        

class UDUserDB :
    def __init__(self) :
        self.db = {};

    def update(self, id, timestamp, location, address) :
        if self.db.has_key(id) :
            K = self.db[id];
        else :
            K = UDUserDBEntry(id);
            self.db[id] = K;
        ret = (K.last_connect_time, K.last_location);
        K.last_connect_time = timestamp;
        K.last_location = location;
        K.address = address;
        return ret

    def get_user(self, id) :
        return self.db[id];

    def is_user(self, id) :
        return self.db.has_key(id);

    def get_count(self) :
        return len(self.db)
        

