# unihousing_backend/db/backends/spatialite/base.py
from django.contrib.gis.db.backends.spatialite.base import *
from django.contrib.gis.db.backends.spatialite.base import DatabaseWrapper as OriginalDatabaseWrapper

class DatabaseWrapper(OriginalDatabaseWrapper):
    def prepare_database(self):
        # Custom initialization to handle Windows-specific issues
        self.connection.execute("SELECT InitSpatialMetaData(1)")
