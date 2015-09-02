export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export DEBIAN_FRONTEND=noninteractive
export PATH="/usr/local/bin:$PATH"


# Thank you stack overflow: http://stackoverflow.com/a/25288289
pushd () {
    command pushd "$@" > /dev/null
}

popd () {
    command popd "$@" > /dev/null
}

echo "Installing base dependencies..."

sudo apt-get update
sudo apt-get install -y postgresql redis-server nginx build-essential

if [ -x /usr/local/bin/python ]
    then echo "python 2.7 already installed, done"
    exit 0
fi

sudo apt-get dist-upgrade

echo "Installing python dependencies..."
sudo apt-get build-dep -y python
sudo apt-get install -y libsqlite3-dev libbz2-dev libncurses5-dev libgdbm-dev

echo "building python 2.7 from source because we're cool and good"

build_dir=`mktemp -d` && pushd $build_dir
curl -sS "https://www.python.org/ftp/python/2.7.10/Python-2.7.10.tgz" | tar xzv
pushd Python-2.7.10
./configure && make && make install
popd

echo "Installing pip and virtualenv goodness..."
python -m ensurepip --upgrade && pip install -I pip setuptools virtualenv virtualenvwrapper

popd

rm -rf $build_dir

echo "build complete"
exit 0
