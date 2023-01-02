export default {
  "title": "Device Config File",
  "description": "Device config file for HAL Media Player",
  "required": [
    "deviceName",
    "volume"
  ],
  "type": "object",
  "properties": {
    "deviceName": {
      "type": "string"
    },
    "volume": {
      "type": "number",
      "minimum": 0,
      "maximum": 200
    }
  }
}
