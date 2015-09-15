export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export DEBIAN_FRONTEND=noninteractive
export PATH="/usr/local/bin:$PATH"
export PYTHONDONTWRITEBYTECODE=1

lockfile='/var/tmp/.brains_install'

if [ -f $lockfile ]
    then echo "VM already provisioned, exiting"
    exit 0
fi

# Thank you stack overflow: http://stackoverflow.com/a/25288289
pushd () {
    command pushd "$@" > /dev/null
}

popd () {
    command popd "$@" > /dev/null
}

echo "Installing base dependencies..."

sudo apt-get update
sudo apt-get install -y postgresql redis-server nginx build-essential libpq-dev libxslt-dev
sudo apt-get dist-upgrade

echo "Creating brains database..."
sudo -u postgres psql -c "CREATE USER brainsuser;"
sudo -u postgres psql -c "CREATE DATABASE brains OWNER brainsuser;"

# lol
sudo -u postgres echo "local all all trust" > /etc/postgresql/9.4/main/pg_hba.conf
sudo /etc/init.d/postgresql restart

echo "Installing python dependencies..."
sudo apt-get build-dep -y python
sudo apt-get install -y libsqlite3-dev libbz2-dev libncurses5-dev libgdbm-dev

echo "building python 2.7 from source because we're cool and good"

build_dir=`mktemp -d` && pushd $build_dir
curl -sS "https://www.python.org/ftp/python/2.7.10/Python-2.7.10.tgz" | tar xz
pushd Python-2.7.10
./configure && make -j 3 && make install
popd

echo "Installing pip and virtualenv goodness..."
python -m ensurepip --upgrade && pip install -I pip setuptools virtualenv virtualenvwrapper

popd

rm -rf $build_dir

mkdir -p /opt/virtualenvs && pushd /opt && pushd virtualenvs
virtualenv udbraaains
. udbraaains/bin/activate

popd
pushd projects/udbraaains/brains

pip install -r requirements.txt
python manage.py syncdb --noinput --migrate

touch $lockfile

echo "build complete"
exit 0
