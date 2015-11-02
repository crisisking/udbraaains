docker-machine create --driver virtualbox --virtualbox-memory "4096" --virtualbox-cpu-count "4" brains
eval "$(docker-machine env brains)"

docker build -t brains/base -f docker/base.docker .
docker build -t brains/postgres -f docker/postgres.docker .
docker build -t brains/python_base -f docker/build_python.docker .
docker build -t brains/project_base -f docker/build_project.docker .
docker build -t brains/django -f docker/django_app.docker .

docker run --name postgres_data brains/postgres echo 'Hello from postgres!'
docker run -d --name db1 -p 5432:5432 --volumes-from postgres_data brains/postgres
docker run --name python brains/python_base echo 'hi from python!'
docker run --name django -p 8000:8000 --volumes-from project_base --volumes-from python brains/django
