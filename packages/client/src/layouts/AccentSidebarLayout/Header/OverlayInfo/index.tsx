import { Chip, Stack, Tooltip } from "@mui/material";
import { useContext } from "react";
import _ from "lodash";
import ErrorIcon from "@mui/icons-material/Error";
import { OverlayContext } from "src/contexts/OverlayContext";

const OverlayInfo: React.FC = () => {
  const { overlayActive, readOnlyBoot } = useContext(OverlayContext);

  return (
    <Stack spacing={1}>
      {overlayActive && (
        <Tooltip
          title={
            "While active, no data is written to the SD card, everything is redirected to the RAM"
          }
        >
          <Chip
            color="warning"
            size="small"
            label="Overlay File System Active"
            icon={<ErrorIcon />}
          />
        </Tooltip>
      )}
      {readOnlyBoot && (
        <Tooltip title={"/boot partition is read-only"}>
          <Chip
            color="warning"
            size="small"
            label="Read-Only /boot"
            icon={<ErrorIcon />}
          />
        </Tooltip>
      )}
    </Stack>
  );
};

export default OverlayInfo;
