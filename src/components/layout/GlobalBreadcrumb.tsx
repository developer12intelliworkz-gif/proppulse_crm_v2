import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const GlobalBreadcrumb = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  // Create an array of breadcrumb items and separators
  const breadcrumbItems = segments.reduce<JSX.Element[]>(
    (acc, segment, index) => {
      const path = "/" + segments.slice(0, index + 1).join("/");
      const isLast = index === segments.length - 1;

      // Add BreadcrumbItem
      acc.push(
        <BreadcrumbItem key={path}>
          {isLast ? (
            <BreadcrumbPage>{decodeURIComponent(segment)}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to={path}>{decodeURIComponent(segment)}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
      );

      // Add BreadcrumbSeparator if not the last item
      if (!isLast) {
        acc.push(<BreadcrumbSeparator key={`separator-${index}`} />);
      }

      return acc;
    },
    []
  );

  return (
    <div className="bg-gray-100 px-6 py-2 border-b border-gray-200">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.length > 0 && <BreadcrumbSeparator />}
          {breadcrumbItems}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default GlobalBreadcrumb;
