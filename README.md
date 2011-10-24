UDBraaains
==========
UDBraaains is a set of tools for tracking a ton of information about the browser game [Urban Dead](http://urbandead.com).
We focus on map data and tracking players across the map, as well as making "shit lists".

You'll find various references to "Goons" throughout the source code.
This project was designed, used, and hosted by members of the [Something Awful forums](http://forums.somethingawful.com) to replace a very bad tool used for the same purpose.

Requirements
------------
Python requirements can be found in requirements.txt. UDBraaains is based on the [Django web framework](http://djangoproject.com) and utilizes [jQuery](http://jquery.com) for its Javascript needs.
Our [IRC bot](https://github.com/underisk/skybot) is an out-of-date fork of the [Skybot Project](https://github.com/rmmh/skybot).

[Redis](http://redis.io) is required to run the project, as it is used directly by [Celery](http://celeryproject.org) tasks and view code.
Redis sets are used for tile update scheduling, so this wart is not likely to be removed in the near-future.

Though not direct requirements, the Goon-run server uses [gunicorn](http://gunicorn.org) with [nginx](http://nginx.org) as a web server, and [PostgreSQL](http://www.postgresql.org) as a database.

You'll need a decent server to run this project. Shared hosting just won't cut it.

Thoughts
--------
This project is total overkill. It was cobbled together in a rush over the course of four to six weeks, and then prodded a few times.

At peak usage, we were supporting around 1,500 players making around 600 or more requests each (mostly because of poor design on my part) over the course of a single day (mostly around lunchtime).

Most Urban Dead groups never come close to being 10% of our peak size.

Most Urban Dead groups would call this project "blatant cheating". I would say that most Urban Dead groups are full of crybabies.

License
-------
Modified BSD License

Contributors
------------
* butternbacon (garnet420)
* crisisking
* kimihia
* underisk
