docker build -t brains/base -f docker/base.docker .
docker build -t brains/postgres -f docker/postgres.docker .
docker build -t brains/redis -f docker/redis.docker .
docker build -t brains/python_base -f docker/build_python.docker .
docker build -t brains/project_base -f docker/build_project.docker .
docker build -t brains/django -f docker/django_app.docker .
docker build -t brains/celery -f docker/celery.docker .
docker build -t brains/nginx -f docker/nginx.docker .

docker volume create --name static_files

docker run --name postgres_data brains/postgres echo 'Hello from postgres!'
docker run -d --name db1 --volumes-from postgres_data brains/postgres
docker run -d --name redis brains/redis
docker run --name python brains/project_base echo 'hi from python!'
docker run --name django -d --volumes-from python -v static_files:/opt/projects/udbraaains/brains/static --link redis:redis --link db1:db brains/django
docker run --name celery -d --volumes-from python --link redis:redis --link db1:db brains/celery
docker run --name nginx -d -p 80:80 -v static_files:/var/www/brains --link django:django brains/nginx
