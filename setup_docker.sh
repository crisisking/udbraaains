docker-machine create --driver virtualbox --virtualbox-memory "4096" --virtualbox-cpu-count "4" brains
eval "$(docker-machine env brains)"

docker build -t brains/base -f docker/base.docker .
docker build -t brains/postgres -f docker/postgres.docker .
docker build -t brains/redis -f docker/redis.docker .
docker build -t brains/python_base -f docker/build_python.docker .
docker build -t brains/project_base -f docker/build_project.docker .
docker build -t brains/django -f docker/django_app.docker .
docker build -t brains/celery -f docker/celery.docker .

docker run --name postgres_data brains/postgres echo 'Hello from postgres!'
docker run -d --name db1 -p 5432:5432 --volumes-from postgres_data brains/postgres
docker run -d --name redis -p 6379:6379 brains/redis
docker run --name python brains/project_base echo 'hi from python!'
