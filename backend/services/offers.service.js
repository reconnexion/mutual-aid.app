const urlJoin = require('url-join');
const { PodResourcesHandlerMixin } = require('@activitypods/app');
const CONFIG = require('../config/config');

module.exports = {
  name: 'offers',
  mixins: [PodResourcesHandlerMixin],
  settings: {
    shapeTreeUri: urlJoin(CONFIG.SHAPE_REPOSITORY_URL, 'shapetrees/maid/Offer')
  }
};
