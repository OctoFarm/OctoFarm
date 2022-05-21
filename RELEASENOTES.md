# Release Notes

 - A full changelog can be found on the github page. https://github.com/OctoFarm/OctoFarm

## [v1.2.1]

### Fixed
- Fixed #963 - Some OctoPrint endpoints would timeout due to slower responses to the others
- Fixed #970 - Main docker image fails to start due to missing paths
- Fixed #966 - Can't bulk disable offline printers because they don't display
- Fixed #965 - iFrame no longer worked due to regression. This is a patch, it will be disabled again in a future release and you will be required to update your .env file.
- Fixed #962 - System page doesn't load on docker installs due to not been a git repository
  