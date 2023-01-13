import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LanIcon from '@mui/icons-material/Lan';
import InfoIcon from '@mui/icons-material/Info';
import BuildIcon from '@mui/icons-material/Build';
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material";

export interface MenuItem {
  link?: string;
  icon?:  OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
    muiName: string;
};
  badge?: string;
  items?: MenuItem[];
  name: string;
}

export interface MenuItems {
  items: MenuItem[];
  heading: string;
}

const menuItems: MenuItems[] = [
  {
    heading: "Gestion",
    items: [
      {
        name: "Playback",
        icon: PlayArrowIcon,
        link: "/playback",
      },
      {
        name: "Network",
        icon: LanIcon,
        link: "/network",
      },
      {
        name: "Setup",
        icon: BuildIcon,
        link: "/setup",
      },
      {
        name: "About",
        icon: InfoIcon,
        link: "/about",
      },
    ],
  },
];


export default menuItems;
