import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import React, { useState, useEffect } from 'react';
import { Table } from 'react-daisyui';

import { Button } from 'react-daisyui';

type Port = {
  IP: string;
  PrivatePort: number;
  PublicPort: number;
  Type: string;
};

interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  Created: string;
  Ports: Port[];
  State: string;
  Status: string;
}

const DockerContainerList: React.FC = () => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);

  useEffect(() => {
    fetch(`http://localhost:3000/docker-api/containers/json`)
      .then((response) => response.json())
      .then((data: DockerContainer[]) => setContainers(data))
      .catch((error) => console.error('Error fetching containers:', error));
  }, []);

  const handleStopContainer = (containerId: string) => {
    // Implement logic to stop the container with the given containerId
    console.log(`Stopping container ${containerId}`);
  };

  const handleStartContainer = (containerId: string) => {
    // Implement logic to start the container with the given containerId
    console.log(`Starting container ${containerId}`);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    const formattedDate = date.toDateString(); // Get the date in a human-readable format
    return formattedDate;
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="py-6 px-4 md:px-6 xl:px-7.5">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Docker Container List
        </h4>
      </div>

      <div className="overflow-x-auto">

      <Table className="w-full">
        <Table.Head>
          <span>Names</span>
          <span>Image</span>
          <span>Created</span>
          <span>Ports</span>
          <span>State</span>
          <span>Last started</span>
          <span>Actions</span>
        </Table.Head>

        <Table.Body>
          {containers.map((container) => (
            <Table.Row>
              <span>{container.Names.join(', ')}</span>
              <span>{container.Image}</span>
              <span>{formatTime(container.Created)}</span>
              <span>{container.Ports[0].PrivatePort + ":" + container.Ports[0].PublicPort }</span>
              <span>{container.State}</span>
              <span>{container.Status}</span>
              <span>
                <Button size='sm' color='success' className='mx-1'>Start</Button>
                <Button size='sm' color='error' className='mx-1'>Stop</Button>
              </span>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      </div>
    </div>
  );
};

const Containers: NextPageWithLayout = () => {
  return (
    <div className="p-3">
      <DockerContainerList />
    </div>
  );
};

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Containers;
