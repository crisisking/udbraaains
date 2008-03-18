"""Simple HTTP server based on the asyncore / asynchat framework

Under asyncore, every time a socket is created it enters a table which is
scanned through select calls by the asyncore.loop() function

All events (a client connecting to a server socket, a client sending data, 
a server receiving data) is handled by the instances of classes derived 
from asyncore.dispatcher

Here the server is represented by an instance of the Server class

When a client connects to it, its handle_accept() method creates an
instance of RequestHandler, one for each HTTP request. It is derived
from asynchat.async_chat, a class where incoming data on the connection
is processed when a "terminator" is received. The terminator can be :
- a string : here we'll use the string \r\n\r\n to handle the HTTP request
line and the HTTP headers
- an integer (n) : the data is processed when n bytes have been read. This
will be used for HTTP POST requests

The data is processed by a method called found_terminator. In RequestHandler,
found_terminator is first set to handle_request_line to handle the HTTP
request line (including the decoding of the query string) and the headers. 
If the method is POST, terminator is set to the number of bytes to read
(the content-length header), and found_terminator is set to handle_post_data

After that, the handle_data() method is called and the connection is closed

Subclasses of RequestHandler only have to override the handle_data() method
"""

import asynchat, asyncore, socket, SimpleHTTPServer, select, urllib
import posixpath, sys, cgi, cStringIO, os, traceback, shutil
import mutex
from Numeric import zeros

class CI_dict(dict):
    """Dictionary with case-insensitive keys
    Replacement for the deprecated mimetools.Message class
    """

    def __init__(self, infile, *args):
        self._ci_dict = {}
        lines = infile.readlines()
        for line in lines:
            k,v=line.split(":",1)
            self._ci_dict[k.lower()] = self[k] = v.strip()
        self.headers = self.keys()
    
    def getheader(self,key,default=""):
        return self._ci_dict.get(key.lower(),default)
    
    def get(self,key,default=""):
        return self._ci_dict.get(key.lower(),default)
    
    def __getitem__(self,key):
        return self._ci_dict[key.lower()]
    
    def __contains__(self,key):
        return key.lower() in self._ci_dict
        
class socketStream:

    def __init__(self,sock):
        """Initiate a socket (non-blocking) and a buffer"""
        self.sock = sock
        self.buffer = cStringIO.StringIO()
        self.closed = 1   # compatibility with SocketServer
    
    def write(self, data):
        """Buffer the input, then send as many bytes as possible"""
        self.buffer.write(data)
        if self.writable():
            buff = self.buffer.getvalue()
            # next try/except clause suggested by Robert Brown
            try:
                    sent = self.sock.send(buff)
            except:
                    # Catch socket exceptions and abort
                    # writing the buffer
                    sent = len(data)

            # reset the buffer to the data that has not yet be sent
            self.buffer=cStringIO.StringIO()
            self.buffer.write(buff[sent:])
            
    def finish(self):
        """When all data has been received, send what remains
        in the buffer"""
        data = self.buffer.getvalue()
        # send data
        while len(data):
            while not self.writable():
                pass
            sent = self.sock.send(data)
            data = data[sent:]

    def writable(self):
        """Used as a flag to know if something can be sent to the socket"""
        return select.select([],[self.sock],[])[1]

class RequestHandler(asynchat.async_chat,
    SimpleHTTPServer.SimpleHTTPRequestHandler):

    protocol_version = "HTTP/1.1"
    MessageClass = CI_dict

    def __init__(self,conn,addr,server):
        asynchat.async_chat.__init__(self,conn)
        self.client_address = addr
        self.connection = conn
        self.server = server
        # set the terminator : when it is received, this means that the
        # http request is complete ; control will be passed to
        # self.found_terminator
        self.set_terminator ('\r\n\r\n')
        self.rfile = cStringIO.StringIO()
        self.found_terminator = self.handle_request_line
        self.request_version = "HTTP/1.1"
        # buffer the response and headers to avoid several calls to select()
        self.wfile = cStringIO.StringIO()

    def collect_incoming_data(self,data):
        """Collect the data arriving on the connexion"""
        self.rfile.write(data)

    def prepare_POST(self):
        """Prepare to read the request body"""
        bytesToRead = int(self.headers.getheader('content-length'))
        # set terminator to length (will read bytesToRead bytes)
        self.set_terminator(bytesToRead)
        self.rfile = cStringIO.StringIO()
        # control will be passed to a new found_terminator
        self.found_terminator = self.handle_post_data
    
    def handle_post_data(self):
        """Called when a POST request body has been read"""
        self.rfile.seek(0)
        self.do_POST()
        self.finish()
            
    def do_GET(self):
        """Begins serving a GET request"""
        # nothing more to do before handle_data()
        self.body = {}
        self.handle_data()
        
    def do_POST(self):
        """Begins serving a POST request. The request data must be readable
        on a file-like object called self.rfile"""
        ctype, pdict = cgi.parse_header(self.headers.getheader('content-type'))
        self.body = cgi.FieldStorage(fp=self.rfile,
            headers=self.headers, environ = {'REQUEST_METHOD':'POST'},
            keep_blank_values = 1)
        self.handle_data()

    def handle_data(self):
        """Class to override"""
        print("handle_data");
        print(self.body);
        f = self.send_head()
        if f:
            self.copyfile(f, self.wfile)

    def handle_request_line(self):
        """Called when the http request line and headers have been received"""
        # prepare attributes needed in parse_request()
        self.rfile.seek(0)
        self.raw_requestline = self.rfile.readline()
        self.parse_request()

        if self.command in ['GET','HEAD']:
            # if method is GET or HEAD, call do_GET or do_HEAD and finish
            method = "do_"+self.command
            if hasattr(self,method):
                getattr(self,method)()
                self.finish()
        elif self.command=="POST":
            # if method is POST, call prepare_POST, don't finish yet
            self.prepare_POST()
        else:
            self.send_error(501, "Unsupported method (%s)" %self.command)

    def end_headers(self):
        """Send the blank line ending the MIME headers, send the buffered
        response and headers on the connection, then set self.wfile to
        this connection
        This is faster than sending the response line and each header
        separately because of the calls to select() in socketStream"""
        if self.request_version != 'HTTP/0.9':
            self.wfile.write("\r\n")
        self.start_resp = cStringIO.StringIO(self.wfile.getvalue())
        self.wfile = socketStream(self.connection)
        self.copyfile(self.start_resp, self.wfile)

    def handle_error(self):
        traceback.print_exc(sys.stderr)
        self.close()

    def copyfile(self, source, outputfile):
        """Copy all data between two file objects
        Set a big buffer size"""
        shutil.copyfileobj(source, outputfile, length = 128*1024)

    def finish(self):
        """Send data, then close"""
        try:
            self.wfile.finish()
        except AttributeError: 
            # if end_headers() wasn't called, wfile is a StringIO
            # this happens for error 404 in self.send_head() for instance
            self.wfile.seek(0)
            self.copyfile(self.wfile, socketStream(self.connection))
        self.close()

class Server(asyncore.dispatcher):
    """Copied from http_server in medusa"""
    def __init__ (self, ip, port,handler):
        self.ip = ip
        self.port = port
        self.handler = handler
        asyncore.dispatcher.__init__ (self)
        self.create_socket (socket.AF_INET, socket.SOCK_STREAM)

        self.set_reuse_addr()
        self.bind ((ip, port))

        # lower this to 5 if your OS complains
        self.listen (1024)

    def handle_accept (self):
        try:
            conn, addr = self.accept()
        except socket.error:
            self.log_info ('warning: server accept() threw an exception', 'warning')
            return
        except TypeError:
            self.log_info ('warning: server accept() threw EWOULDBLOCK', 'warning')
            return
        # creates an instance of the handler class to handle the request/response
        # on the incoming connexion
        self.handler(conn,addr,self)

from datetime import datetime

class UDMapEntry :
    def __init__(self, p) :
        self.position = p;
        self.indoor_time = datetime.utcnow();
        self.indoor_user = 0;
        self.indoor_zombies = 0;
        self.indoor_survivors = 0;
        self.outdoor_time = datetime.utcnow();
        self.outdoor_user = 0;
        self.outdoor_zombies = 0;
        self.outdoor_survivors = 0;
        self.cade_time = datetime.utcnow();
        self.cade_user = 0;
        self.cade_level = 0;
        self.ruin_time = datetime.utcnow();
        self.ruin_user = 0;
        self.ruin = 0;

    def dump(self) :
        print(" " + str(self.position) + " " + str(self.indoor_zombies) + " " + str(self.indoor_survivors) + " " + str(self.indoor_time) + " " + str(self.indoor_user));
        print("    " + str(self.outdoor_zombies) + " " + str(self.outdoor_survivors) + " " + str(self.outdoor_time) + " " + str(self.outdoor_user));

class UDMap :
    def __init__(self) :
        self.map_data = {};
#        self.map_mutex = mutex.mutex();
        for i in range(10000) :
            self.map_data[i] = UDMapEntry(i);

    def get(self, p) :
        return self.map_data[p];

#    def set(x,y,data) :
#        
        
ud_map = UDMap();    

burb_dict = {'suburb=dakerstown':(0,0),
             'suburb=jensentown':(1,0),
             'suburb=quarlesbank':(2,0),
             'suburb=west+boundwood':(3,0),
             'suburb=east+boundwood':(4,0),
             'suburb=lamport+hills':(5,0),
             'suburb=chancelwood':(6,0),
             'suburb=earletown':(7,0),
             'suburb=rhodebank':(8,0),
             'suburb=dulston':(9,0),

             'suburb=roywood':(0,1),
             'suburb=judgewood':(1,1),
             'suburb=gatcombeton':(2,1),
             'suburb=shuttlebank':(3,1),
             'suburb=yagoton':(4,1),
             'suburb=millen+hills':(5,1),
             'suburb=raines+hills':(6,1),
             'suburb=pashenton':(7,1),
             'suburb=rolt+heights':(8,1),
             'suburb=pescoside':(9,1),
             
             'suburb=peddlesden+village':(0,2),
             'suburb=chudleyton':(1,2),
             'suburb=darvall+heights':(2,2),
             'suburb=eastonwood':(3,2),
             'suburb=brooke+hills':(4,2),
             'suburb=shearbank':(5,2),
             'suburb=huntley+heights':(6,2),
             'suburb=santlerville':(7,2),
             'suburb=gibsonton':(8,2),
             'suburb=dunningwood':(9,2),
             
             'suburb=dunell+hills':(0,3),
             'suburb=west+becktown':(1,3),
             'suburb=east+becktown':(2,3),
             'suburb=richmond+hills':(3,3),
             'suburb=ketchelbank':(4,3),
             'suburb=roachtown':(5,3),
             'suburb=randallbank':(6,3),
             'suburb=heytown':(7,3),
             'suburb=spracklingbank':(8,3),
             'suburb=paynerton':(9,3),

             'suburb=owsleybank':(0,4),
             'suburb=molebank':(1,4),
             'suburb=lukinswood':(2,4),
             'suburb=havercroft':(3,4),
             'suburb=barrville':(4,4),
             'suburb=ridleybank':(5,4),
             'suburb=pimbank':(6,4),
             'suburb=pappardville':(7,4),
             'suburb=pitneybank':(8,4),
             'suburb=starlingtown':(9,4),

             'suburb=grigg+heights':(0,5),
             'suburb=reganbank':(1,5),
             'suburb=lerwill+heights':(2,5),
             'suburb=shore+hills':(3,5),
             'suburb=galbraith+hills':(4,5),
             'suburb=stanbury+village':(5,5),
             'suburb=roftwood':(6,5),
             'suburb=edgecombe':(7,5),
             'suburb=pegton':(8,5),
             'suburb=dentonside':(9,5),

             'suburb=crooketon':(0,6),
             'suburb=mornington':(1,6),
             'suburb=north+blythville':(2,6),
             'suburb=brooksville':(3,6),
             'suburb=mockridge+heights':(4,6),
             'suburb=shackleville':(5,6),
             'suburb=tollyton':(6,6),
             'suburb=crowbank':(7,6),
             'suburb=vinetown':(8,6),
             'suburb=houldenbank':(9,6),

             'suburb=nixbank':(0,7),
             'suburb=wykewood':(1,7),
             'suburb=south+blythville':(2,7),
             'suburb=greentown':(3,7),
             'suburb=tapton':(4,7),
             'suburb=kempsterbank':(5,7),
             'suburb=wray+heights':(6,7),
             'suburb=gulsonside':(7,7),
             'suburb=osmondville':(8,7),
             'suburb=penny+heights':(9,7),

             'suburb=foulkes+village':(0,8),
             'suburb=ruddlebank':(1,8),
             'suburb=lockettside':(2,8),
             'suburb=dartside':(3,8),
             'suburb=kinch+heights':(4,8),
             'suburb=west+grayside':(5,8),
             'suburb=east+grayside':(6,8),
             'suburb=scarletwood':(7,8),
             'suburb=pennville':(8,8),
             'suburb=fryerbank':(9,8),
             
             'suburb=new+arkham':(0,9),
             'suburb=old+arkham':(1,9),
             'suburb=spicer+hills':(2,9),
             'suburb=williamsville':(3,9),
             'suburb=buttonville':(4,9),
             'suburb=wyke+hills':(5,9),
             'suburb=hollomstown':(6,9),
             'suburb=danversbank':(7,9),
             'suburb=whittenside':(8,9),
             'suburb=miltown':(9,9)}


class UDRequestHandler(RequestHandler) :
    foo = 1;

    def process_datum(self, x) :
        p = x.split(':');
        if len(p) != 3 :
            print("error - bad datum size");
            self.send_respone(501);
            return
        try:
            datum = map(int, p);
            if datum[0] < 0 or datum[0] > 9999 :
                print("error - bad datum location " + datum[0]);
                self.send_response(501);
                return
            M = ud_map.get(datum[0]);
#            M.dump();
            if datum[1] == 1 :
                # barricades
                M.cade_level = datum[2];
                M.cade_timestamp = self.timestamp;
                M.cade_user = self.userid;
            elif datum[1] == 2 :
                # outdoor zombies
                M.outdoor_zombies = datum[2];
                M.outdoor_timestamp = self.timestamp;
                M.outdoor_user = self.userid;
            elif datum[1] == 3 :
                # indoor zombies
                M.indoor_zombies = datum[2];
                M.indoor_timestamp = self.timestamp;
                M.indoor_user = self.userid;
            elif datum[1] == 4 :
                M.ruin = datum[2];
                M.ruin_timestamp = self.timestamp;
                M.ruin_user = self.userid;
            else :
                print("bad field " + datum[1]);
                self.send_response(501);
                return
#            print(M);
#            M.dump();
        except ValueError:
            print("bad datum " + p);
            self.send_response(501);
            return
        
    def handle_incoming_data(self) :
        if not self.body.has_key('data') :
            print("error - no data field");
            self.send_response(501);
            return
        data_data = self.body.getvalue('data').split('|');
        # print(data_data);
        def U(x) : return self.process_datum(x)
        map(U, data_data);

    def get_suburb_data(self, coords) :
        return
        
    def handle_data(self):
        print("my_handle_data");
        self.my_path = self.path.split('?');
        if len(self.my_path) == 0 :
            print("error - no path");
            self.send_response(501);
            return
        if self.my_path[0] == '/ud_xml' :
            self.handle_udbrainmap();
            return
        elif self.my_path[0] == '/udb' :
            self.handle_udbrain();
            return
        else :
            self.send_response(404);
            return

    def handle_udbrainmap(self) :
        if len(self.my_path) != 2 :
            print("error - no request");
            self.send_response(501);
            return
        if not burb_dict.has_key(self.my_path[1]) :
            print("bad suburb " + self.my_path[1]);
            self.send_response(501);
            return
        get_suburb_data(burb_dict[self.my_path[1]]);

    def handle_udbrain(self) :
#        print(self.body);
#        print(self.path);
#        print(self.body.getvalue('user').split(':'));
#        print(self.body.getvalue('data').split('|'));
        self.timestamp = datetime.utcnow();
        #        user_data = self.body.getvalue('user');
        if not self.body.has_key('user') :
            print("error - no user field");
            self.send_response(501);
            return
        user_data = self.body.getvalue('user').split(':');
        if len(user_data) != 4 :
            print("error - wrong user data size");
            self.send_response(501);
            return
        if user_data[1] != '0.666' :
            print("wrong UDBrain version " + user_data[1]);
            self.send_response(501);
            return
        try:
            self.userid = int(user_data[0]);
            self.user_pos = int(user_data[2]);
            if self.user_pos < 0 or self.user_pos > 9999 :
                print("bad location " + self.user_pos);
                self.send_response(501);
                return
            
            if user_data[3] == '1' :
                print "in street";
            elif user_data[3] == '2' :
                print "outside building";
            elif user_data[3] == '3':
                print "inside building";
            else :
                print("bad location type " + user_data[3]);
                self.send_response(501);
                return

            self.handle_incoming_data();
            
        except ValueError:
            print("bad data");
            print(user_data);
            self.send_response(501);
            return
        
#        .split(':');
#        self.userid = user_data[0];
        
        
if __name__=="__main__":
    # launch the server on the specified port
    port = 8081
    s=Server('',port,UDRequestHandler)
    print "SimpleAsyncHTTPServer running on port %s" %port
    try:
        asyncore.loop(timeout=2)
    except KeyboardInterrupt:
        print "Crtl+C pressed. Shutting down."
