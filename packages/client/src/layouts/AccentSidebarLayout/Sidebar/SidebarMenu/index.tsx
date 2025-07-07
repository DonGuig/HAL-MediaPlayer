import { ListSubheader, Box, List } from '@mui/material';
import { useLocation, matchPath } from 'react-router-dom';
import SidebarMenuItem from './item';
import menuItems, { MenuItem } from './items';
import { styled } from '@mui/material/styles';
import React from 'react';

const MenuWrapper = styled(Box)(
  ({ theme }) => `
  .MuiList-root {
    margin-bottom: ${theme.spacing(.5)};
    padding: 0;

    & > .MuiList-root {
      padding: 0 ${theme.spacing(0)} ${theme.spacing(1)};
    }
  }

    .MuiListSubheader-root {
      text-transform: uppercase;
      font-weight: bold;
      font-size: ${theme.typography.pxToRem(11)};
      color: ${theme.sidebar.menuItemHeadingColor};
      padding: ${theme.spacing(0.8, 2)};
      line-height: 1.4;
    }
`
);

const SubMenuWrapper = styled(Box)(
  ({ theme }) => `
    .MuiList-root {

      .MuiListItem-root {
        padding: 1px;
        padding-left: ${theme.spacing(0)};
        padding-right: ${theme.spacing(0)};

        .MuiBadge-root {
          position: absolute;
          right: ${theme.spacing(4)};

          .MuiBadge-standard {
            background: ${theme.colors.primary.main};
            font-size: ${theme.typography.pxToRem(9)};
            font-weight: bold;
            text-transform: uppercase;
            color: ${theme.palette.primary.contrastText};
          }
        }
    
        .MuiButton-root {
          display: flex;
          color: ${theme.sidebar.menuItemColor};
          background-color: ${theme.sidebar.menuItemBg};
          width: 100%;
          border-radius: 0;
          justify-content: flex-start;
          font-size: ${theme.typography.pxToRem(13)};
          padding: ${theme.spacing(3)};
          padding-top: ${theme.spacing(1)};
          padding-bottom: ${theme.spacing(1)};

          &:after {
            content: '';
            position: absolute;
            height: 100%;
            right: 0;
            top: 0;
            width: 0;
            opacity: 0;
            transition: ${theme.transitions.create(['opacity', 'width'])};
            background: ${theme.sidebar.menuItemColorActive};
            border-top-left-radius: ${theme.general.borderRadius};
            border-bottom-left-radius: ${theme.general.borderRadius};
          }
    
          .MuiButton-startIcon,
          .MuiButton-endIcon {
            transition: ${theme.transitions.create(['color'])};

            .MuiSvgIcon-root {
              font-size: inherit;
              transition: none;
            }
          }

          .MuiButton-startIcon {
            font-size: ${theme.typography.pxToRem(26)};
            margin-right: ${theme.spacing(1.5)};
            color: ${theme.sidebar.menuItemIconColor};
          }
          
          .MuiButton-endIcon {
            margin-left: auto;
            font-size: ${theme.typography.pxToRem(22)};
          }

          &.Mui-active,
          &:hover {
            background-color: ${theme.sidebar.menuItemBgActive};
            color: ${theme.sidebar.menuItemColorActive};

            .MuiButton-startIcon,
            .MuiButton-endIcon {
                color: ${theme.sidebar.menuItemIconColorActive};
            }
          }

          &.Mui-active {
            &:after {
              width: 5px;
              opacity: 1;
            }
          }
        }

        &.Mui-children {
          flex-direction: column;
          line-height: 1;

          & > .MuiButton-root {
            .MuiBadge-root {
              right: ${theme.spacing(7)};
            }
          }

          .MuiButton-root.Mui-active {
            &:after {
              opacity: 0;
            }
          }
        }

        .MuiCollapse-root {
          width: 100%;

          .MuiList-root {
            padding: ${theme.spacing(1, 0)};
          }

          .MuiListItem-root {
            padding: 1px;
            padding-left: ${theme.spacing(0)};
            padding-right: ${theme.spacing(0)};

            .MuiButton-root {
              font-size: ${theme.typography.pxToRem(13)};
              padding: ${theme.spacing(0.5, 2, 0.5, 3.6)};
              font-weight: normal;

              &:before {
                content: '';
                background: ${theme.sidebar.menuItemIconColor};
                opacity: .8;
                transition: ${theme.transitions.create(['background'])};
                width: 6px;
                height: 6px;
                border-radius: 20px;
                margin-right: ${theme.spacing(2.9)};
              }

              &.Mui-active,
              &:hover {
                background-color: ${theme.sidebar.menuItemBg};

                &:before {
                  background: ${theme.sidebar.menuItemIconColorActive};
                }

                &:after {
                  opacity: 0;
                }
              }
            }
          }
        }
      }
    }
`
);

const renderSidebarMenuItems = ({
  items,
  path
}: {
  items: MenuItem[];
  path: string;
}): React.JSX.Element => (
  <SubMenuWrapper>
    <List component="div">
      {items.reduce((ev, item) => reduceChildRoutes({ ev, item, path }), [])}
    </List>
  </SubMenuWrapper>
);

const reduceChildRoutes = ({
  ev,
  path,
  item
}: {
  ev: React.JSX.Element[];
  path: string;
  item: MenuItem;
}): Array<React.JSX.Element> => {
  const key = item.name;

  const exactMatch = item.link ? !!matchPath({
    path: item.link,
    end: true
  }, path) : false;

  if (item.items) {
    const partialMatch = item.link ? !!matchPath({
      path: item.link,
      end: false
    }, path) : false;

    ev.push(
      <SidebarMenuItem
        key={key}
        active={partialMatch}
        open={partialMatch}
        name={item.name}
        icon={item.icon}
        link={item.link}
        badge={item.badge}
      >
        {renderSidebarMenuItems({
          path,
          items: item.items
        })}
      </SidebarMenuItem>
    );
  } else {
    ev.push(
      <SidebarMenuItem
        key={key}
        active={exactMatch}
        name={item.name}
        link={item.link}
        badge={item.badge}
        icon={item.icon}
      />
    );
  }

  return ev;
}

function SidebarMenu() {
  const location = useLocation();

  return (
    <>
      {menuItems.map((section) => (
        <MenuWrapper key={section.heading}>
          <List
            component="div"
            subheader={
              <ListSubheader component="div" disableSticky>{section.heading}</ListSubheader>
            }
          >
            {renderSidebarMenuItems({
              items: section.items,
              path: location.pathname
            })}
          </List>
        </MenuWrapper>
      ))}
    </>
  );
}

export default SidebarMenu;
